export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') {
    return 'Rs. 0';
  }
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
  if (isNaN(numericAmount)) {
    return 'Rs. 0';
  }
  return `Rs. ${numericAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatCompactCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') {
    return 'Rs. 0';
  }
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
  if (isNaN(numericAmount)) {
    return 'Rs. 0';
  }
  if (numericAmount >= 10000000) {
    return `Rs. ${(numericAmount / 10000000).toFixed(1)}Cr`;
  }
  if (numericAmount >= 100000) {
    return `Rs. ${(numericAmount / 100000).toFixed(1)}L`;
  }
  if (numericAmount >= 1000) {
    return `Rs. ${(numericAmount / 1000).toFixed(1)}k`;
  }
  return `Rs. ${numericAmount.toLocaleString('en-IN')}`;
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
