export const STATUS_LABEL = {
  PENDING: 'Oczekuje',
  CONFIRMED: 'Potwierdzona',
  CANCELLED: 'Anulowana',
  COMPLETED: 'Zakończona',
};

export const StatusBadge = ({ status }) => (
  <span className={`badge status-${status.toLowerCase()}`}>{STATUS_LABEL[status]}</span>
);
