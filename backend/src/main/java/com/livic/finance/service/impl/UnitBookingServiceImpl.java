import com.livic.auth.service.interfaces.AuthorizationService;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.UnitBookingTbl;
import com.livic.finance.dto.UnitBookingDTOs;
import com.livic.finance.service.interfaces.UnitBookingCrudService;
import com.livic.finance.service.interfaces.UnitBookingService;
import com.livic.payment.domain.PaymentTransactionTbl;
import com.livic.payment.facade.PaymentFacade;
import com.livic.property.domain.UnitTbl;
import com.livic.property.facade.PropertyFacade;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import com.livic.finance.mapper.UnitBookingMapper;
import lombok.RequiredArgsConstructor;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.stream.Collectors;

import com.livic.property.dto.UnitSummaryDTO;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UnitBookingServiceImpl implements UnitBookingService {

    private final UnitBookingCrudService unitBookingCrudService;
    private final PropertyFacade propertyFacade;
    private final PaymentFacade paymentFacade;
    private final AuthorizationService authorizationService;
    private final UserFacade userFacade;

    @Override
    public UnitBookingDTOs.UnitBookingResponse createBooking(UnitBookingDTOs.CreateBookingRequest request) {
        log.info("Processing booking creation for unit: {}, tenant name: {}", request.unitId(), request.prospectiveTenantName());

        boolean available = propertyFacade.isUnitAvailableOnDate(request.unitId(), request.expectedMoveInDate());
        if (!available) {
            throw new BusinessException(HttpStatus.CONFLICT, "No vacancy available in this unit on the requested date");
        }

        UnitSummaryDTO unitSummary = propertyFacade.getUnitById(request.unitId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found"));
        UnitTbl unit = new UnitTbl();
        unit.setId(unitSummary.id());

        UnitBookingTbl booking = UnitBookingMapper.toEntity(request, unit);
        booking = unitBookingCrudService.save(booking);
        return UnitBookingMapper.toResponse(booking);
    }

    @Override
    public UnitBookingDTOs.UnitBookingResponse forfeitBooking(UUID bookingId, UUID userDetailsId) {
        log.info("Processing booking forfeit for ID: {} by user: {}", bookingId, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermissionByUnitId(booking.getUnit().getId(), "LEASE_UPDATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        booking.setStatus("FORFEITED");
        booking = unitBookingCrudService.save(booking);
        return UnitBookingMapper.toResponse(booking);
    }

    @Override
    public UnitBookingDTOs.UnitBookingResponse refundBooking(UUID bookingId, UUID userDetailsId) {
        log.info("Processing booking refund for ID: {} by user: {}", bookingId, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermissionByUnitId(booking.getUnit().getId(), "LEASE_UPDATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        booking.setStatus("REFUNDED");
        booking = unitBookingCrudService.save(booking);
        return UnitBookingMapper.toResponse(booking);
    }

    @Override
    public PaymentTransactionTbl initiateTokenOnlinePayment(UUID bookingId, UUID userDetailsId) {
        log.info("Initiating token online payment for booking: {} by user: {}", bookingId, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermissionByUnitId(booking.getUnit().getId(), "LEASE_CREATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        if (!"BOOKED".equals(booking.getStatus())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking is not in BOOKED status");
        }

        UUID payerUserId = resolvePayerUserId(booking, userDetailsId);

        return paymentFacade.initiateOnlinePaymentEntity(
                payerUserId,
                "UNIT_BOOKING",
                bookingId,
                booking.getTokenAmount()
        );
    }

    @Override
    public PaymentTransactionTbl recordTokenCashPayment(UUID bookingId, BigDecimal amount, String note, UUID userDetailsId) {
        log.info("Recording token cash payment for booking: {} amount: {} by user: {}", bookingId, amount, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermissionByUnitId(booking.getUnit().getId(), "LEASE_UPDATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        if (!"BOOKED".equals(booking.getStatus())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking is not in BOOKED status");
        }

        UUID payerUserId = resolvePayerUserId(booking, userDetailsId);

        return paymentFacade.recordCashPaymentEntity(
                payerUserId,
                "UNIT_BOOKING",
                bookingId,
                amount,
                userDetailsId,
                note
        );
    }

    private UnitBookingTbl getBookingOrThrow(UUID id) {
        return unitBookingCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit booking not found"));
    }

    private UUID resolvePayerUserId(UnitBookingTbl booking, UUID fallbackUserId) {
        UUID payerUserId = booking.getProspectiveTenantUserId();
        if (payerUserId == null) {
            if (booking.getProspectiveTenantEmail() != null) {
                UserSummaryDTO u = userFacade.getUserByEmail(booking.getProspectiveTenantEmail()).orElse(null);
                if (u != null) {
                    payerUserId = u.id();
                }
            }
        }
        return payerUserId != null ? payerUserId : fallbackUserId;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitBookingDTOs.UnitBookingResponse> listBookings() {
        return unitBookingCrudService.findAll().stream()
                .map(UnitBookingMapper::toResponse)
                .collect(Collectors.toList());
    }
}
