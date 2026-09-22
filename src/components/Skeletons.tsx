import React from 'react';
import { Box, Skeleton, Card, CardContent } from '@mui/material';

/**
 * Layout-shaped loading placeholders. Preferred over a centred spinner: the page
 * keeps its shape while data arrives, so nothing jumps when it lands.
 */

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 6,
  columns = 5,
}) => (
  <Card>
    <Box sx={{ p: 4, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 3 }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} variant="text" width={`${100 / columns}%`} height={14} />
      ))}
    </Box>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box
        key={rowIndex}
        sx={{
          px: 4,
          py: 3.5,
          display: 'flex',
          gap: 3,
          alignItems: 'center',
          borderBottom: rowIndex === rows - 1 ? 0 : 1,
          borderColor: 'divider',
        }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="text"
            width={`${100 / columns}%`}
            height={colIndex === 0 ? 20 : 16}
          />
        ))}
      </Box>
    ))}
  </Card>
);

export const StatCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: `repeat(${count}, 1fr)` },
      gap: 4,
    }}
  >
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index}>
        <CardContent>
          <Skeleton variant="rounded" width={40} height={40} sx={{ mb: 4 }} />
          <Skeleton variant="text" width="55%" height={30} />
          <Skeleton variant="text" width="75%" height={14} />
        </CardContent>
      </Card>
    ))}
  </Box>
);

/** Full-page placeholder used while a lazily-loaded route module downloads. */
export const PageSkeleton: React.FC = () => (
  <Box sx={{ p: { xs: 4, md: 6 }, width: '100%' }}>
    <Skeleton variant="text" width={220} height={36} sx={{ mb: 6 }} />
    <Box sx={{ mb: 6 }}>
      <StatCardsSkeleton />
    </Box>
    <TableSkeleton />
  </Box>
);
