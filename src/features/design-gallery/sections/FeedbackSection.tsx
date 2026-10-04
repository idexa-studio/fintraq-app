import { GalleryGroup, Specimen } from '@/src/features/design-gallery/components/Specimen';
import { Banner, EmptyState, ListGroup, Skeleton, SkeletonRow } from '@/src/components/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import React, { useState } from 'react';
import { View } from 'react-native';

const noop = () => {};

export function FeedbackSection() {
  const { spacing } = useTheme();
  const [showInfo, setShowInfo] = useState(true);

  return (
    <View style={{ gap: spacing('9') }}>
      <GalleryGroup title="Status">
        <Specimen
          title="Banner"
          description="Inline, persistent message about the current screen. For decisions that block, use ConfirmDialog."
          guidelines={[
            'info — neutral tips. success — confirmation that stays visible.',
            'warning — needs attention soon (backup is 30 days old).',
            'danger — something failed and the user can fix it.',
            'Offer an action when there is a clear next step.',
          ]}
          bare
        >
          {showInfo ? (
            <Banner tone="info" title="Tip" message="Swipe a transaction left to edit or delete it." onDismiss={() => setShowInfo(false)} />
          ) : null}
          <Banner tone="success" title="Backup complete" message="Last synced to Google Drive just now." />
          <Banner tone="warning" title="Backup is 32 days old" message="Back up now so you don't lose recent changes." actionLabel="Back up now" onAction={noop} />
          <Banner tone="danger" title="Couldn't restore backup" message="Check your connection and try again." actionLabel="Retry" onAction={noop} />
        </Specimen>

        <Specimen
          title="EmptyState"
          description="What to show when there is nothing to show. Always explain why it's empty and what to do next."
          guidelines={[
            'block — a whole screen or list is empty.',
            'inline — one section or card is empty.',
            'After a search or filter, offer to clear it rather than to create.',
          ]}
          bare
        >
          <View style={{ borderRadius: 20, overflow: 'hidden' }}>
            <EmptyState
              icon="receipt"
              title="No transactions yet"
              description="Add your first expense or income to start tracking where your money goes."
              actionLabel="Add transaction"
              onAction={noop}
            />
          </View>
          <EmptyState variant="inline" icon="chart-pie" title="Not enough data" description="Charts appear after a week of transactions." />
          <EmptyState variant="inline" icon="search" title="No matches" description="Try a different search." actionLabel="Clear" onAction={noop} />
        </Specimen>
      </GalleryGroup>

      <GalleryGroup title="Loading">
        <Specimen
          title="Skeleton"
          description="Placeholder shaped like the content that's loading. Prefer skeletons over spinners for lists and cards."
          guidelines={['Match the real layout so nothing jumps when data arrives.', 'Use a spinner only inside buttons or for actions under ~1s.']}
          bare
        >
          <View style={{ gap: spacing('2') }}>
            <Skeleton width="40%" height={12} />
            <Skeleton width="70%" height={28} radius="md" />
          </View>
          <ListGroup>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </ListGroup>
          <View style={{ flexDirection: 'row', gap: spacing('3'), alignItems: 'center' }}>
            <Skeleton circle height={48} />
            <Skeleton width={120} height={36} radius="lg" />
            <Skeleton width={36} height={36} radius="md" />
          </View>
        </Specimen>
      </GalleryGroup>
    </View>
  );
}
