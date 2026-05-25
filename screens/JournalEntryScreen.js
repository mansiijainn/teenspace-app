import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useCallback } from 'react';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const BRUSH_SIZES = [2, 4, 8, 14];

function DoodleBlock({ paths, onUpdate }) {
  const [localPaths, setLocalPaths] = useState(paths || []);
  const [currentPath, setCurrentPath] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const isDrawing = useRef(false);
  const pointsRef = useRef([]);
  const { accentColor } = useTheme();

  const buildPath = (points) => {
    if (!points.length) return '';
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) d += ` L${points[i].x},${points[i].y}`;
    return d;
  };

  const handleTouchStart = (e) => {
    isDrawing.current = true;
    const touch = e.nativeEvent.touches[0];
    const point = { x: touch.locationX, y: touch.locationY };
    pointsRef.current = [point];
    setCurrentPath({ d: `M${point.x},${point.y}`, color: isEraser ? '#111' : selectedColor, size: isEraser ? brushSize * 3 : brushSize });
  };

  const handleTouchMove = (e) => {
    if (!isDrawing.current) return;
    const touch = e.nativeEvent.touches[0];
    pointsRef.current.push({ x: touch.locationX, y: touch.locationY });
    setCurrentPath({ d: buildPath(pointsRef.current), color: isEraser ? '#111' : selectedColor, size: isEraser ? brushSize * 3 : brushSize });
  };

  const handleTouchEnd = () => {
    if (!isDrawing.current || !pointsRef.current.length) return;
    isDrawing.current = false;
    const newPath = { d: buildPath(pointsRef.current), color: isEraser ? '#111' : selectedColor, size: isEraser ? brushSize * 3 : brushSize };
    const updated = [...localPaths, newPath];
    setLocalPaths(updated);
    onUpdate(updated);
    setCurrentPath(null);
    pointsRef.current = [];
  };

  const undo = () => {
    const updated = localPaths.slice(0, -1);
    setLocalPaths(updated);
    onUpdate(updated);
  };

  return (
    <View style={styles.doodleBlock}>
      {/* Mini toolbar */}
      {showTools && (
        <View style={styles.doodleTools}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.doodleToolsRow}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.doodleColor, { backgroundColor: c, borderWidth: selectedColor === c && !isEraser ? 2 : 0, borderColor: accentColor }]}
                  onPress={() => { setSelectedColor(c); setIsEraser(false); }}
                />
              ))}
              {BRUSH_SIZES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.doodleBrush, { borderColor: brushSize === s ? accentColor : '#444', backgroundColor: brushSize === s ? accentColor + '22' : '#1a1a1a' }]}
                  onPress={() => setBrushSize(s)}
                >
                  <View style={{ width: s + 2, height: s + 2, borderRadius: s, backgroundColor: '#fff' }} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.doodleToolBtn, { borderColor: isEraser ? accentColor : '#444' }]} onPress={() => setIsEraser(!isEraser)}>
                <Text style={styles.doodleToolBtnText}>eraser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.doodleToolBtn, { borderColor: '#444' }]} onPress={undo}>
                <Text style={styles.doodleToolBtnText}>undo</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Canvas */}
      <View
        style={styles.doodleCanvas}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {localPaths.map((p, i) => (
            <Path key={i} d={p.d} stroke={p.color} strokeWidth={p.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {currentPath && (
            <Path d={currentPath.d} stroke={currentPath.color} strokeWidth={currentPath.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </Svg>
        <TouchableOpacity style={styles.toolsToggle} onPress={() => setShowTools(v => !v)}>
          <Text style={styles.toolsToggleText}>{showTools ? 'hide tools' : 'show tools'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function JournalEntryScreen({ entry, onClose }) {
  const parseBlocks = () => {
    if (!entry.blocks) return [{ type: 'text', content: entry.content || '', id: '1' }];
    try { return JSON.parse(entry.blocks); }
    catch { return [{ type: 'text', content: '', id: '1' }]; }
  };

  const [blocks, setBlocks] = useState(parseBlocks);
  const [title, setTitle] = useState(entry.title || '');
  const [saving, setSaving] = useState(false);
  const { theme, accentColor } = useTheme();

  const updateBlock = (id, updates) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const addTextBlock = () => {
    setBlocks(prev => [...prev, { type: 'text', content: '', id: Date.now().toString() }]);
  };

  const addDoodleBlock = () => {
    setBlocks(prev => [...prev, { type: 'doodle', paths: [], id: Date.now().toString() }]);
  };

  const deleteBlock = (id) => {
    if (blocks.length <= 1) return;
    Alert.alert('delete block', 'remove this block?', [
      { text: 'cancel', style: 'cancel' },
      { text: 'delete', style: 'destructive', onPress: () => setBlocks(prev => prev.filter(b => b.id !== id)) }
    ]);
  };

  const save = async () => {
    setSaving(true);
    const textContent = blocks.filter(b => b.type === 'text').map(b => b.content).join('\n');
    await supabase
      .from('journal_entries')
      .update({
        title: title.trim(),
        content: textContent,
        blocks: JSON.stringify(blocks),
        updated_at: new Date().toISOString(),
      })
      .eq('id', entry.id);
    setSaving(false);
    onClose();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.headerBtn, { color: theme.subtext }]}>back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={save} disabled={saving}>
            <Text style={[styles.saveBtn, { color: accentColor }]}>{saving ? 'saving...' : 'save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Title */}
          <TextInput
            style={[styles.titleInput, { color: theme.text, borderBottomColor: theme.border }]}
            placeholder="title"
            placeholderTextColor={theme.subtext}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Blocks */}
          {blocks.map((block) => (
            <View key={block.id} style={styles.blockWrapper}>
              {block.type === 'text' ? (
                <TextInput
                  style={[styles.textBlock, { color: theme.text }]}
                  placeholder="write anything..."
                  placeholderTextColor={theme.subtext}
                  value={block.content}
                  onChangeText={(text) => updateBlock(block.id, { content: text })}
                  multiline
                  textAlignVertical="top"
                />
              ) : (
                <DoodleBlock
                  paths={block.paths}
                  onUpdate={(paths) => updateBlock(block.id, { paths })}
                />
              )}
              {blocks.length > 1 && (
                <TouchableOpacity style={styles.deleteBlock} onPress={() => deleteBlock(block.id)}>
                  <Text style={styles.deleteBlockText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom bar */}
        <View style={[styles.bottomBar, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={addTextBlock}>
            <Text style={[styles.addBtnText, { color: theme.text }]}>+ text</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={addDoodleBlock}>
            <Text style={[styles.addBtnText, { color: theme.text }]}>+ doodle</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerBtn: { fontSize: 15 },
  saveBtn: { fontSize: 15, fontWeight: '700' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  blockWrapper: { marginBottom: 12, position: 'relative' },
  textBlock: {
    fontSize: 16,
    lineHeight: 26,
    minHeight: 120,
    paddingTop: 4,
  },
  deleteBlock: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  deleteBlockText: { color: '#555', fontSize: 14 },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  addBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  addBtnText: { fontWeight: '600', fontSize: 14 },

  // Doodle block styles
  doodleBlock: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#111', marginBottom: 4 },
  doodleTools: { backgroundColor: '#0f0f0f', paddingVertical: 8, paddingHorizontal: 12 },
  doodleToolsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doodleColor: { width: 24, height: 24, borderRadius: 12 },
  doodleBrush: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  doodleToolBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  doodleToolBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  doodleCanvas: { height: 200, backgroundColor: '#111', position: 'relative' },
  toolsToggle: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  toolsToggleText: { color: '#888', fontSize: 11 },
});