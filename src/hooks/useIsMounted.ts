import { useCallback, useEffect, useRef } from 'react';

/**
 * Determines whether the React component is mounted
 * @returns Whether the component is mounted
 */
export default function useIsMounted() {
	const isMountedRef = useRef(false);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	return useCallback(() => isMountedRef.current, []);
}
