export default function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: '#fee',
      color: '#c00',
      border: '1px solid #fcc',
      borderRadius: '4px',
      marginBottom: '16px',
      fontSize: '14px'
    }}>
      {message}
    </div>
  );
}