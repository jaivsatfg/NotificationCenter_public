
import { Shimmer, ShimmerElementsGroup, ShimmerElementType } from "@fluentui/react";
import * as React from "react";

export function TransversalShimmer(): JSX.Element {
    const shimmerWithElementFirstRow = [
        { type: ShimmerElementType.gap, width: '60%' },
    ];

    const wrapperStyle = { display: 'flex; flex-flow: column;' }
    return (
        <Shimmer customElementsGroup={
            <div style={wrapperStyle}>
                <ShimmerElementsGroup
                    width={'60%'}
                    shimmerElements={[
                        { type: ShimmerElementType.line, height: 25, width: '95%' },
                        { type: ShimmerElementType.gap, height: 25, width: '5%' },
                    ]}
                />
                <Shimmer shimmerElements={shimmerWithElementFirstRow} />
                <ShimmerElementsGroup
                    width={'60%'}
                    shimmerElements={[
                        { type: ShimmerElementType.line, height: 25, width: '95%' },
                        { type: ShimmerElementType.gap, height: 25, width: '5%' },
                    ]}
                />
                <Shimmer shimmerElements={shimmerWithElementFirstRow} />
                <ShimmerElementsGroup
                    width={'60%'}
                    shimmerElements={[
                        { type: ShimmerElementType.line, height: 150, width: '30%' },
                        { type: ShimmerElementType.gap, height: 150, width: '3%' },
                        { type: ShimmerElementType.line, height: 150, width: '30%' },
                        { type: ShimmerElementType.gap, height: 150, width: '3%' },
                        { type: ShimmerElementType.line, height: 150, width: '30%' },
                        { type: ShimmerElementType.gap, height: 150, width: '4%' },
                    ]}
                />
            </div>
        } width="100%" />
    );
}
