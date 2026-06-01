import { fireEvent, render } from '@testing-library/react-native';
import ConfirmDeleteSheet from '../components/ConfirmDeleteSheet';

describe('ConfirmDeleteSheet', () => {
  it('renders title, message, and an error when provided', () => {
    const { getByText } = render(
      <ConfirmDeleteSheet
        visible
        title="Delete track?"
        message="This will be permanent."
        error="Something went wrong."
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(getByText('Delete track?')).toBeTruthy();
    expect(getByText('This will be permanent.')).toBeTruthy();
    expect(getByText('Something went wrong.')).toBeTruthy();
  });

  it('fires onConfirm and onCancel when their buttons are pressed', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <ConfirmDeleteSheet
        visible
        title="Delete?"
        message="msg"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(getByTestId('confirm-delete-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId('confirm-delete-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not fire handlers while busy', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <ConfirmDeleteSheet
        visible
        busy
        title="Delete?"
        message="msg"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(getByTestId('confirm-delete-confirm'));
    fireEvent.press(getByTestId('confirm-delete-cancel'));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
