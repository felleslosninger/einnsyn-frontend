export function isStandardClick(event: React.MouseEvent): boolean {
  // Check if the click is a standard left click (button 0)
  return (
    event.button === 0 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
