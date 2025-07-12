import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders the Dashboard page by default', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  const heading = screen.getByText(/dashboard/i);
  expect(heading).toBeInTheDocument();
});

test('renders Saved Invoices page when route is /saved-invoices', () => {
  render(
    <MemoryRouter initialEntries={['/saved-invoices']}>
      <App />
    </MemoryRouter>
  );
  const title = screen.getByText(/saved invoices/i);
  expect(title).toBeInTheDocument();
});

test('renders NotFound page for unknown route', () => {
  render(
    <MemoryRouter initialEntries={['/unknown-page']}>
      <App />
    </MemoryRouter>
  );
  const notFoundText = screen.getByText(/404/i);
  expect(notFoundText).toBeInTheDocument();
});
