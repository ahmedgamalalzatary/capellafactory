type SubmitLock = {
  current: boolean;
};

export async function runWithSubmitLock(
  lock: SubmitLock,
  setIsSubmitting: (isSubmitting: boolean) => void,
  submit: () => Promise<void>,
) {
  if (lock.current) {
    return;
  }

  lock.current = true;
  setIsSubmitting(true);

  try {
    await submit();
  } finally {
    lock.current = false;
    setIsSubmitting(false);
  }
}
