import * as React from 'react';
import { Shimmer, ShimmerElementType, ThemeProvider, mergeStyles } from '@fluentui/react';

const wrapperClass = mergeStyles({
  padding: 2,
  selectors: {
    '& > .ms-Shimmer-container': {
      margin: '10px 0',
    },
  },
});
const shimmerWithElementSecondRow = [
    { type: ShimmerElementType.line, width: 16, height: 16  },
    { type: ShimmerElementType.gap, width: '2%' },
    { type: ShimmerElementType.line, height: 16, width: 130 },
    { type: ShimmerElementType.gap, width: '2%' },
    { type: ShimmerElementType.line, height: 16, width: 40 },
  ];
  export const DocsShimmer: React.FunctionComponent = () => {
    return (
      <ThemeProvider className={wrapperClass}>
        <Shimmer shimmerElements={shimmerWithElementSecondRow} />
        <Shimmer shimmerElements={shimmerWithElementSecondRow} />
        <Shimmer shimmerElements={shimmerWithElementSecondRow} />
        <Shimmer shimmerElements={shimmerWithElementSecondRow} />
        </ThemeProvider>
    );
  };
