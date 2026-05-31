import React, { useState } from 'react';
import { View, Text, TextInput, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONTS } from '../constants/theme';
import { PrimaryButton, SecondaryButton } from './Buttons';

interface CreateWorkspaceSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<{ error: string | null }>;
}

export default function CreateWorkspaceSheet({ visible, onClose, onSave }: CreateWorkspaceSheetProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setDescription('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    const result = await onSave(name, description);
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
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 20, color: C.text, letterSpacing: -0.4, marginBottom: 6 }}>New workspace</Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, marginBottom: 20, lineHeight: 20 }}>
            Group agents by project, client, or context — like a folder for your crew.
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Board deck · Client Acme · Side project"
              placeholderTextColor={C.textMuted}
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
                marginBottom: 16,
              }}
            />
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Q3 launch prep"
              placeholderTextColor={C.textMuted}
              style={{
                backgroundColor: C.c2,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 14,
                padding: 16,
                color: C.text,
                fontFamily: FONTS.regular,
                fontSize: 16,
                marginBottom: 12,
              }}
            />
            {error ? (
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: '#f87171', marginBottom: 12 }}>{error}</Text>
            ) : null}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <SecondaryButton onPress={handleClose} style={{ flex: 1 }}>Cancel</SecondaryButton>
            <PrimaryButton onPress={handleSave} disabled={loading || !name.trim()} style={{ flex: 2 }}>
              {loading ? 'Creating…' : 'Create workspace'}
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
