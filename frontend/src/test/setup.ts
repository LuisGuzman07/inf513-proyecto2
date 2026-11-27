import '@testing-library/jest-dom';

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:ficticio';
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {};
}
