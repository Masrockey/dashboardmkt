import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({
    className,
    alt = 'Logo Honda',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/storage/images/logo-honda.svg"
            alt={alt}
            className={className}
            {...props}
        />
    );
}
