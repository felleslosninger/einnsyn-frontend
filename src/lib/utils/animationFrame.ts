// A helper function to wait for a specified number of animation frames
// Usage: await animationFrame(2); // waits for 2 animation frames
export const animationFrame = async (count = 1) => {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  }
};
