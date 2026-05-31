import React, { useState } from 'react';
import { View, Text, TextInput, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONTS } from '../constants/theme';
import { PrimaryButton, SecondaryButton } from './Buttons';

interface AddMemorySheetProps {
  visible: boolean;
  agentName: string;
  onClose: () => void;
  onSave: (text: string) => Promise<{ error: string | null }>;
}

export default function AddMemorySheet({ visible, agentName, onClose, onSave }: AddMemorySheetProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setText('');
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    const result = await onSave(text);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <View style={{ backgroundColor: C.c0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 24, paddingBottom: insets.bottom + 24, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 20, color: C.text, letterSpacing: -0.4, marginBottom: 6 }}>Add a fact</Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, marginBottom: 20, lineHeight: 20 }}>
            {agentName} will use this in chat and when running tasks — like things you'd tell a real assistant once.
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="I'm on EST · prefer bullet summaries · no meetings before 10am"
              placeholderTextColor={C.textMuted}
              multiline
              autoFocus
              style={{
                backgroundColor: C.c2,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 14,
                padding: 16,
                color: C.text,
                fontFamily: FONTS.regular,
                fontSize: 16,
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 12,
              }}
            />
            {error && (
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: '#f87171', marginBottom: 12 }}>{error}</Text>
            )}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <SecondaryButton onPress={handleClose} style={{ flex: 1 }}>Cancel</SecondaryButton>
            <PrimaryButton onPress={handleSave} disabled={loading || !text.trim()} style={{ flex: 2 }}>
              {loading ? 'Saving…' : 'Save fact'}
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
