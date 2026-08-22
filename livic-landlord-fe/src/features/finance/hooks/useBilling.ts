import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBillingStatus, getPlans, subscribeToPlan, topUpWallet, verifyPayment } from '@/src/features/finance/api/billing.api';

export function useBilling(token: string) {
  const queryClient = useQueryClient();

  const { data: billingData = null, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['billingStatus', token],
    queryFn: () => getBillingStatus(token),
    enabled: !!token,
  });

  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['billingPlans', token],
    queryFn: () => getPlans(token).catch(() => []),
    enabled: !!token,
  });

  const subscribeMutation = useMutation({
    mutationFn: (args: { planName: string; amount: number; billingCycle: 'MONTHLY' | 'YEARLY' }) =>
      subscribeToPlan(args, token),
  });

  const topUpMutation = useMutation({
    mutationFn: (args: { amount: number }) =>
      topUpWallet(args, token),
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (args: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature?: string }) =>
      verifyPayment(args, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingStatus', token] });
    },
  });

  const isLoading = isStatusLoading || isPlansLoading;

  return {
    billingData,
    plans,
    isLoading,
    refetchStatus,
    subscribeToPlan: subscribeMutation.mutateAsync,
    isSubscribing: subscribeMutation.isPending,
    topUpWallet: topUpMutation.mutateAsync,
    isTopUpPending: topUpMutation.isPending,
    verifyPayment: verifyPaymentMutation.mutateAsync,
    isVerifyingPayment: verifyPaymentMutation.isPending,
  };
}
