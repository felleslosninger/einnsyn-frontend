'use client';

import cn from '~/lib/utils/className';

export default function EinContainer({
	pre,
	post,
	children,
	className,
	collapsible = false,
	...props
}: {
	pre?: React.ReactNode;
	post?: React.ReactNode;
	collapsible?: boolean;
	children: React.ReactNode;
} & React.DetailedHTMLProps<
	React.HTMLAttributes<HTMLDivElement>,
	HTMLDivElement
>) {
	return (
		<div className={cn('container-wrapper', className)}>
			<div className={cn('container-pre', { collapsible })}>{pre}</div>
			<div className="container" {...props}>
				{children}
			</div>
			<div className="container-post">{post}</div>
		</div>
	);
}
