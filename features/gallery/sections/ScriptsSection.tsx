import { Button, Card, ListGroup, ListRow, Text, ThemeProvider, useTheme } from '@/design';
import React from 'react';
import { View } from 'react-native';

/**
 * The languages the bundled faces cannot draw, each shown in the system-font
 * ramp the app uses for it and, below, in the Latin ramp for comparison (which
 * is what would happen without the switch). Used to check weights survive and
 * nothing is clipped (plan tasks B6.03 and B6.04). Reachable only by link
 * (`?section=scripts`).
 */
const SAMPLES = [
  { language: 'Hindi', title: 'आपकी शेष राशि', action: 'खर्च जोड़ें', row: 'किराना', sub: 'आज · रोज़मर्रा का खाता', body: 'सब कुछ आपके फ़ोन पर ही रहता है, जब तक आप बैकअप चालू नहीं करते।' },
  { language: 'Marathi', title: 'तुमची शिल्लक', action: 'खर्च जोडा', row: 'किराणा', sub: 'आज · दैनंदिन खाते', body: 'तुम्ही बॅकअप सुरू करेपर्यंत सर्व काही तुमच्या फोनवरच राहते.' },
  { language: 'Bengali', title: 'আপনার ব্যালেন্স', action: 'খরচ যোগ করুন', row: 'মুদি', sub: 'আজ · দৈনন্দিন অ্যাকাউন্ট', body: 'ব্যাকআপ চালু না করা পর্যন্ত সবকিছু আপনার ফোনেই থাকে।' },
  { language: 'Tamil', title: 'உங்கள் இருப்பு', action: 'செலவைச் சேர்', row: 'மளிகை', sub: 'இன்று · அன்றாடக் கணக்கு', body: 'காப்புப்பிரதியை இயக்கும் வரை எல்லாம் உங்கள் தொலைபேசியிலேயே இருக்கும்.' },
  { language: 'Telugu', title: 'మీ బ్యాలెన్స్', action: 'ఖర్చు జోడించండి', row: 'కిరాణా', sub: 'ఈరోజు · రోజువారీ ఖాతా', body: 'మీరు బ్యాకప్ ఆన్ చేసే వరకు అన్నీ మీ ఫోన్‌లోనే ఉంటాయి.' },
  { language: 'Kannada', title: 'ನಿಮ್ಮ ಬ್ಯಾಲೆನ್ಸ್', action: 'ವೆಚ್ಚ ಸೇರಿಸಿ', row: 'ದಿನಸಿ', sub: 'ಇಂದು · ದೈನಂದಿನ ಖಾತೆ', body: 'ನೀವು ಬ್ಯಾಕಪ್ ಆನ್ ಮಾಡುವವರೆಗೆ ಎಲ್ಲವೂ ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲೇ ಇರುತ್ತದೆ.' },
  { language: 'Japanese', title: '残高', action: '支出を追加', row: '食料品', sub: '今日 · 普通預金', body: 'バックアップをオンにするまで、すべてのデータはこの端末内に保存されます。' },
];

function Sample({ sample }: { sample: (typeof SAMPLES)[number] }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <Text variant="title">{sample.title}</Text>
      <ListGroup>
        <ListRow icon="shopping-cart" strong title={sample.row} subtitle={sample.sub} value="−₹420" />
      </ListGroup>
      <Text variant="body">{sample.body}</Text>
      <Button label={sample.action} />
    </View>
  );
}

export function ScriptsSection() {
  const { space, scheme } = useTheme();
  return (
    <>
      {SAMPLES.map((sample) => (
        <View key={sample.language} style={{ gap: space.md }}>
          <Text variant="captionStrong">{`${sample.language} · system-font ramp`}</Text>
          <ThemeProvider scheme={scheme} script="system">
            <Sample sample={sample} />
          </ThemeProvider>
          <Text variant="captionStrong">{`${sample.language} · Latin ramp, for comparison`}</Text>
          <Card><Sample sample={sample} /></Card>
        </View>
      ))}
    </>
  );
}
