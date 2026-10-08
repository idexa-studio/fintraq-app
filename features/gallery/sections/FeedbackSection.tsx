import { Specimen } from '@/features/gallery/components/Specimen';
import {
  Button, Card, Checklist, Dialog, DialogPanel, Emblem, LoadingDialog, Message, Notice, ProgressRow, Section, Sheet, SheetPanel, Spinner, TextField, Tip, Toast,
  useTheme, useToast,
} from '@/design';
import React, { useState } from 'react';
import { View } from 'react-native';

export function FeedbackSection() {
  const { space, colors } = useTheme();
  const [dialog, setDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState(false);
  const toast = useToast();

  const showLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2500);
  };

  return (
    <>
      <Section title="Messages">
        <Specimen name="Message" note="One thing at a time: picture, serif headline, a sentence. Also the empty state.">
          <View style={{ paddingVertical: space.xl }}>
            <Message
              illustration={<Emblem icon="bell" />}
              title="Want a nudge to log your spending?"
              body="Turn on a daily reminder so nothing slips through."
            />
          </View>
        </Specimen>
        <Specimen name="Message with a checklist">
          <Message illustration={<Emblem icon="cloud-arrow-up" />} title="Back up before you switch phones" body="Your data lives on this device until you do.">
            <Checklist items={['Sign in with Google', 'Keep the app open until the backup finishes']} />
          </Message>
        </Specimen>
      </Section>

      <Section title="Notices">
        <Specimen name="Notice" note="Stays on the page. At most one link.">
          <Notice title="Your personal information" body="Everything stays on your device unless you turn on backup." linkLabel="Privacy policy" />
          <Notice tone="positive" title="Backup complete" body="Last saved a minute ago." />
          <Notice tone="warning" title="Backup is 9 days old" body="Connect to the internet to save a new one." />
          <Notice tone="danger" title="Couldn’t restore" body="The file is from a newer version. Update the app and try again." />
        </Specimen>
      </Section>

      <Section title="Toast">
        <Specimen name="Toast" note="A brief confirmation at the foot of the screen, with one way to take it back.">
          <Toast message="Expense saved" actionLabel="Undo" />
          <Toast message="Backup file saved to Downloads" />
          <Button label="Show a toast" variant="secondary" onPress={() => toast.show({ message: 'Expense saved', actionLabel: 'Undo' })} />
        </Specimen>
      </Section>

      <Section title="Progress">
        <Specimen name="Progress row" note="Long work shown where it was started: what, how far, and a bar. Travelling when the amount is not known.">
          <Card padded={false}>
            <ProgressRow title="Backing up" detail="Uploading to Google Drive" value={0.62} />
          </Card>
          <Card padded={false}>
            <ProgressRow title="Restoring" detail="Reading your backup" />
          </Card>
        </Specimen>
      </Section>

      <Section title="Tips and notes">
        <Specimen name="Tip" note="A one-time hint pointing at a control. One sentence, one way to dismiss.">
          <Tip message="Tap a tucked card to change that answer." dismissLabel="Got it" pointerAt={0.2} />
          <Tip message="Swipe a row left to edit or delete it." dismissLabel="Got it" pointer="bottom" pointerAt={0.8} />
        </Specimen>
        <Specimen name="Update needed" note="When this version can no longer be used. One button, no way round it.">
          <View style={{ paddingVertical: space.xl, gap: space.xl }}>
            <Message illustration={<Emblem icon="download-simple" />} title="Time to update" body="This version of Fintraq is no longer supported. Your data is safe and will be there after you update." />
            <Button label="Update Fintraq" />
          </View>
        </Specimen>
        <Specimen name="What's new" note="After an update: what changed, in a sentence, once.">
          <Notice title="New in this version" body="A new look, a Plan tab, and backups you can save as a file." linkLabel="See everything that changed" />
        </Specimen>
      </Section>

      <Section title="Spinner">
        <Specimen name="Spinner" note="Only for work that blocks; lists use placeholders." row>
          <Spinner />
          <Spinner icon="lock" />
          <Spinner size={space.xl} />
        </Specimen>
      </Section>

      <Section title="Dialogs">
        <Specimen name="Dialog" note="The title is the question; the first button repeats the verb.">
          <View style={{ backgroundColor: colors.scrim, padding: space.xl }}>
            <DialogPanel title="Delete this transaction?" body="This can’t be undone.">
              <Button label="Delete transaction" variant="danger" />
              <Button label="Keep it" variant="secondary" />
            </DialogPanel>
          </View>
          <Button label="Open dialog" variant="secondary" onPress={() => setDialog(true)} />
        </Specimen>
        <Specimen name="Loading dialog" note="For the few seconds something must not be interrupted.">
          <View style={{ backgroundColor: colors.scrim, padding: space.xl }}>
            <DialogPanel title="Please wait">
              <View style={{ alignItems: 'center', paddingVertical: space.sm }}><Spinner icon="lock" /></View>
            </DialogPanel>
          </View>
          <Button label="Show for a moment" variant="secondary" onPress={showLoading} />
        </Specimen>
      </Section>

      <Section title="Sheet">
        <Specimen name="Sheet" note="A task over the current screen: white header, grey page, button pinned below.">
          <View style={{ backgroundColor: colors.scrim, paddingTop: space.xl }}>
            <SheetPanel title="Add expense" onClose={() => {}} footer={<Button label="Continue" />}>
              <TextField label="Amount" value="$42.10" />
            </SheetPanel>
          </View>
          <Button label="Open sheet" variant="secondary" onPress={() => setSheet(true)} />
        </Specimen>
      </Section>

      <Dialog visible={dialog} onRequestClose={() => setDialog(false)} title="Delete this transaction?" body="This can’t be undone.">
        <Button label="Delete transaction" variant="danger" onPress={() => setDialog(false)} />
        <Button label="Keep it" variant="secondary" onPress={() => setDialog(false)} />
      </Dialog>
      <LoadingDialog visible={loading} title="Please wait" />
      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Add expense" footer={<Button label="Continue" onPress={() => setSheet(false)} />}>
        <TextField label="Amount" placeholder="$0.00" keyboardType="decimal-pad" />
        <TextField label="Note" placeholder="Optional" />
      </Sheet>
    </>
  );
}
