const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

const ISO_MONTH_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  timeZone: 'Asia/Jakarta',
});

export interface PortfolioDate {
  year: string;
  monthYear: string;
  isoMonth: string;
}

/**
 * Formats a timestamp into Asia/Jakarta portfolio display strings and ISO year-month.
 */
export function formatPortfolioDate(date: Date = new Date()): PortfolioDate {
  const isoMonth = ISO_MONTH_FORMATTER.format(date);
  return {
    year: isoMonth.slice(0, 4),
    monthYear: MONTH_YEAR_FORMATTER.format(date),
    isoMonth,
  };
}
