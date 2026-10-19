export function creditRateLabel(value: string | null | undefined): string {
  if (typeof value !== 'string' || !/^\d+(?:\.\d+)?$/.test(value)) return 'No informada';
  const [integer, decimals = ''] = value.split('.');
  const significant = decimals.replace(/0+$/, '');
  return `${integer}${significant ? `,${significant}` : ''}%`;
}
