import { GalleryGroup, Specimen } from '@/src/features/design-gallery/components/Specimen';
import {
  CalculatorBottomSheet,
  ColorPickerBottomSheet,
  CurrencyPickerBottomSheet,
  IconPickerBottomSheet,
} from '@/src/components/pickers';
import {
  AlertDialog,
  BentoBottomSheet,
  Button,
  ConfirmDialog,
  ListGroup,
  ListItem,
  OptionsBottomSheet,
  OptionsDialog,
  Text,
  TextInputDialog,
} from '@/src/components/ui';
import { CATEGORY_ICON_GROUPS, PALETTE_COLOR_OPTIONS } from '@/src/constants/picker';
import { useTheme } from '@/src/providers/ThemeProvider';
import { CalculatorIcon, CoinsIcon, CopyIcon, ExportIcon, PaletteIcon, PencilSimpleIcon, SquaresFourIcon, TrashIcon } from '@/src/components/ui/icons';
import React, { useState } from 'react';
import { View } from 'react-native';

type OverlayKey =
  | 'sheet' | 'optionsSheet' | 'alert' | 'confirm' | 'optionsDialog' | 'textInput'
  | 'currency' | 'color' | 'icon' | 'calculator';

export function OverlaysSection() {
  const { spacing, colors } = useTheme();
  const [open, setOpen] = useState<OverlayKey | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [color, setColor] = useState(PALETTE_COLOR_OPTIONS[0].hex);
  const [icon, setIcon] = useState('coffee');
  const [amount, setAmount] = useState('250');
  const [name, setName] = useState('Groceries');
  const close = () => setOpen(null);

  return (
    <View style={{ gap: spacing('9') }}>
      <GalleryGroup title="Sheets">
        <Specimen
          title="BentoBottomSheet"
          description="The base sheet: drag to dismiss, keyboard aware, dynamic height. Build custom pickers and forms on it."
          guidelines={[
            'Sheets for choosing or composing; dialogs for confirming.',
            'Give long lists a fixed snap point (["75%"]) so the list scrolls inside.',
          ]}
        >
          <Button title="Open bottom sheet" variant="tonal" fullWidth onPress={() => setOpen('sheet')} />
        </Specimen>

        <Specimen title="OptionsBottomSheet" description="Action menu or single-choice list from the bottom — row long-press menus, language picker.">
          <Button title="Open options sheet" variant="tonal" fullWidth onPress={() => setOpen('optionsSheet')} />
        </Specimen>
      </GalleryGroup>

      <GalleryGroup title="Dialogs">
        <Specimen
          title="Dialogs"
          description="Centred modals that interrupt. Keep them rare."
          guidelines={[
            'ConfirmDialog — irreversible or destructive actions. Title asks the question, confirm label repeats the verb ("Delete").',
            'AlertDialog — the outcome of something the user did (success / error).',
            'OptionsDialog — 2–5 choices where a sheet would feel heavy.',
            'TextInputDialog — rename a single field.',
          ]}
          contentStyle={{ gap: spacing('2') }}
        >
          <Button title="ConfirmDialog (destructive)" variant="secondary" fullWidth onPress={() => setOpen('confirm')} />
          <Button title="AlertDialog" variant="secondary" fullWidth onPress={() => setOpen('alert')} />
          <Button title="OptionsDialog" variant="secondary" fullWidth onPress={() => setOpen('optionsDialog')} />
          <Button title="TextInputDialog" variant="secondary" fullWidth onPress={() => setOpen('textInput')} />
        </Specimen>
      </GalleryGroup>

      <GalleryGroup title="Pickers">
        <Specimen title="Pickers" description="Domain pickers built on BentoBottomSheet (src/components/pickers)." bare>
          <ListGroup>
            <ListItem icon={CoinsIcon} title="CurrencyPickerBottomSheet" value={currency} onPress={() => setOpen('currency')} />
            <ListItem icon={PaletteIcon} iconColor={color} title="ColorPickerBottomSheet" value={color} onPress={() => setOpen('color')} />
            <ListItem icon={SquaresFourIcon} title="IconPickerBottomSheet" value={icon} onPress={() => setOpen('icon')} />
            <ListItem icon={CalculatorIcon} title="CalculatorBottomSheet" value={amount} onPress={() => setOpen('calculator')} />
          </ListGroup>
        </Specimen>
      </GalleryGroup>

      <BentoBottomSheet visible={open === 'sheet'} onClose={close}>
        <View style={{ padding: spacing('5'), gap: spacing('3') }}>
          <Text variant="headline">Bottom sheet</Text>
          <Text variant="callout" tone="muted">
            Drag the handle down, tap the backdrop, or use the button to dismiss. Content sizes the sheet.
          </Text>
          <Button title="Done" fullWidth size="lg" onPress={close} />
        </View>
      </BentoBottomSheet>

      <OptionsBottomSheet
        visible={open === 'optionsSheet'}
        onClose={close}
        title="Transaction"
        subtitle="Groceries · ₹250"
        options={[
          { key: 'edit', label: 'Edit', icon: PencilSimpleIcon, onPress: close },
          { key: 'dup', label: 'Duplicate', icon: CopyIcon, onPress: close },
          { key: 'share', label: 'Share', icon: ExportIcon, onPress: close },
          { key: 'delete', label: 'Delete', icon: TrashIcon, destructive: true, onPress: close },
        ]}
      />

      <ConfirmDialog
        visible={open === 'confirm'}
        onClose={close}
        title="Delete this transaction?"
        message="It will be removed from all reports. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={close}
      />

      <AlertDialog
        visible={open === 'alert'}
        onClose={close}
        type="success"
        title="Backup complete"
        message="Your data is safely stored in Google Drive."
        buttons={[{ text: 'Done', onPress: close }]}
      />

      <OptionsDialog
        visible={open === 'optionsDialog'}
        onClose={close}
        title="Sort by"
        options={[
          { key: 'date', label: 'Newest first', selected: true, onPress: close },
          { key: 'amount', label: 'Highest amount', onPress: close },
          { key: 'category', label: 'Category', hint: 'A → Z', onPress: close },
        ]}
      />

      <TextInputDialog
        visible={open === 'textInput'}
        onClose={close}
        onSave={(v) => { setName(v); close(); }}
        title="Rename category"
        subtitle="Shown in reports and filters"
        initialValue={name}
        placeholder="Category name"
        maxLength={30}
      />

      <CurrencyPickerBottomSheet visible={open === 'currency'} onClose={close} value={currency} onChange={setCurrency} />
      <ColorPickerBottomSheet visible={open === 'color'} onClose={close} value={color} onChange={setColor} palette={PALETTE_COLOR_OPTIONS} />
      <IconPickerBottomSheet visible={open === 'icon'} onClose={close} value={icon} onChange={setIcon} groups={CATEGORY_ICON_GROUPS} accentColor={colors.primary} />
      <CalculatorBottomSheet visible={open === 'calculator'} onClose={close} value={amount} onConfirm={setAmount} currency={currency} />
    </View>
  );
}
