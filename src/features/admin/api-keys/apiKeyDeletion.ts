export async function deleteApiKeyAndUpdateUi(
  formData: FormData,
  deleteApiKey: (formData: FormData) => Promise<void>,
  onSuccess: () => void,
): Promise<void> {
  await deleteApiKey(formData);
  onSuccess();
}
