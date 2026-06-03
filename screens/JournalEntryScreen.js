import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Alert, Image,
  PanResponder, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useCallback } from 'react';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';

const { width: SW } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 60;

// ─── Fonts (Expo Go safe) ─────────────────────────────────────────────────────
const FONTS = [
  { label: 'Default',  value: undefined,       preview: 'Aa' },
  { label: 'Serif',    value: 'serif',          preview: 'Aa' },
  { label: 'Mono',     value: 'monospace',      preview: 'Aa' },
  { label: 'Georgia',  value: Platform.OS === 'ios' ? 'Georgia' : 'serif',       preview: 'Aa' },
  { label: 'Courier',  value: Platform.OS === 'ios' ? 'Courier New' : 'monospace', preview: 'Aa' },
  { label: 'Rounded',  value: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-medium', preview: 'Aa' },
];
const SIZES        = [12, 14, 16, 18, 20, 24, 28, 32];
const PEN_SIZES    = [2, 4, 7, 12, 18];
const ERASER_SIZES = [10, 20, 36, 56];

// ─── HSL → hex ────────────────────────────────────────────────────────────────
function hslToHex(h, s = 100, l = 50) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}
const HUE_STOPS = Array.from({ length: 13 }, (_, i) => hslToHex(i * 30));

// ─── Color slider ─────────────────────────────────────────────────────────────
function ColorSlider({ color, onChange }) {
  const sliderW = SW - 100;
  const [hue, setHue] = useState(0);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: e => updateHue(e.nativeEvent.locationX),
    onPanResponderMove:  e => updateHue(e.nativeEvent.locationX),
  })).current;

  const updateHue = x => {
    const h = Math.round((Math.max(0, Math.min(x, sliderW)) / sliderW) * 360);
    setHue(h);
    onChange(hslToHex(h));
  };

  return (
    <View style={styles.sliderRow}>
      <LinearGradient
        colors={HUE_STOPS}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.sliderTrack, { width: sliderW }]}
        {...pan.panHandlers}
      >
        <View style={[styles.sliderThumb, { left: (hue / 360) * sliderW - 10, backgroundColor: hslToHex(hue) }]} />
      </LinearGradient>
      <View style={[styles.sliderPreview, { backgroundColor: hslToHex(hue) }]} />
    </View>
  );
}

// ─── Dropdown popover ─────────────────────────────────────────────────────────
function Popover({ visible, onClose, children, theme }) {
  if (!visible) return null;
  return (
    <View style={[styles.popover, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {children}
    </View>
  );
}

// ─── Format toolbar ───────────────────────────────────────────────────────────
function FormatToolbar({ fmt, onChange, accentColor, theme }) {
  const [open, setOpen] = useState(null); // 'font' | 'size' | 'color' | null

  const toggle = panel => setOpen(v => v === panel ? null : panel);
  const active = (k, v) => fmt[k] === v;
  const set    = (k, v) => {
    onChange({ ...fmt, [k]: active(k, v) ? undefined : v });
    setOpen(null);
  };

  const currentFont = FONTS.find(f => f.value === fmt.fontFamily) || FONTS[0];
  const currentSize = fmt.fontSize || 16;

  return (
    <View style={{ zIndex: 100 }}>
      <View style={[styles.formatBar, { backgroundColor: theme.input, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.fmtRow}>

            {/* Font picker button */}
            <TouchableOpacity
              onPress={() => toggle('font')}
              style={[styles.fmtPill, { borderColor: open === 'font' ? accentColor : theme.border, backgroundColor: open === 'font' ? accentColor + '22' : 'transparent' }]}
            >
              <Text style={[styles.fmtPillText, { color: open === 'font' ? accentColor : theme.text, fontFamily: currentFont.value }]}>
                {currentFont.label}
              </Text>
              <Text style={[styles.fmtChevron, { color: theme.subtext }]}>▾</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Size picker button */}
            <TouchableOpacity
              onPress={() => toggle('size')}
              style={[styles.fmtPill, { borderColor: open === 'size' ? accentColor : theme.border, backgroundColor: open === 'size' ? accentColor + '22' : 'transparent' }]}
            >
              <Text style={[styles.fmtPillText, { color: open === 'size' ? accentColor : theme.text }]}>
                {currentSize}px
              </Text>
              <Text style={[styles.fmtChevron, { color: theme.subtext }]}>▾</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Color button */}
            <TouchableOpacity
              onPress={() => toggle('color')}
              style={[styles.fmtPill, { borderColor: open === 'color' ? accentColor : theme.border, backgroundColor: open === 'color' ? accentColor + '22' : 'transparent' }]}
            >
              <View style={[styles.colorPreviewDot, { backgroundColor: fmt.color || theme.text }]} />
              <Text style={[styles.fmtPillText, { color: open === 'color' ? accentColor : theme.subtext }]}>color</Text>
              <Text style={[styles.fmtChevron, { color: theme.subtext }]}>▾</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Bold / Italic */}
            {[['B','fontWeight','bold'],['I','fontStyle','italic']].map(([l,k,v]) => (
              <TouchableOpacity key={l} onPress={() => { onChange({ ...fmt, [k]: active(k,v) ? undefined : v }); setOpen(null); }}
                style={[styles.fmtBtn, { borderColor: active(k,v) ? accentColor : theme.border, backgroundColor: active(k,v) ? accentColor+'33' : 'transparent' }]}>
                <Text style={[styles.fmtBtnText, { color: active(k,v) ? accentColor : theme.subtext, fontWeight: l==='B'?'bold':'normal', fontStyle: l==='I'?'italic':'normal' }]}>{l}</Text>
              </TouchableOpacity>
            ))}

          </View>
        </ScrollView>
      </View>

      {/* Font popover */}
      <Popover visible={open === 'font'} theme={theme}>
        <Text style={[styles.popoverLabel, { color: theme.subtext }]}>font</Text>
        <View style={styles.fontGrid}>
          {FONTS.map(f => (
            <TouchableOpacity
              key={f.label}
              onPress={() => set('fontFamily', f.value)}
              style={[styles.fontCard, { borderColor: fmt.fontFamily === f.value ? accentColor : theme.border, backgroundColor: fmt.fontFamily === f.value ? accentColor+'22' : theme.input }]}
            >
              <Text style={[styles.fontCardPreview, { fontFamily: f.value, color: fmt.fontFamily === f.value ? accentColor : theme.text }]}>Aa</Text>
              <Text style={[styles.fontCardLabel, { color: fmt.fontFamily === f.value ? accentColor : theme.subtext }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Popover>

      {/* Size popover */}
      <Popover visible={open === 'size'} theme={theme}>
        <Text style={[styles.popoverLabel, { color: theme.subtext }]}>size</Text>
        <View style={styles.sizeGrid}>
          {SIZES.map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => set('fontSize', s)}
              style={[styles.sizeCard, { borderColor: fmt.fontSize === s ? accentColor : theme.border, backgroundColor: fmt.fontSize === s ? accentColor+'22' : theme.input }]}
            >
              <Text style={[styles.sizeCardText, { fontSize: Math.min(s, 22), color: fmt.fontSize === s ? accentColor : theme.text }]}>Aa</Text>
              <Text style={[styles.sizeCardLabel, { color: fmt.fontSize === s ? accentColor : theme.subtext }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Popover>

      {/* Color popover */}
      <Popover visible={open === 'color'} theme={theme}>
        <Text style={[styles.popoverLabel, { color: theme.subtext }]}>text color</Text>
        <ColorSlider color={fmt.color} onChange={c => onChange({ ...fmt, color: c })} />
      </Popover>

    </View>
  );
}

// ─── Draw canvas ──────────────────────────────────────────────────────────────
function DrawCanvas({ paths, onUpdate, theme, accentColor, canvasHeight, bottomOffset }) {
  const [penColor,    setPenColor]    = useState(accentColor);
  const [penSize,     setPenSize]     = useState(4);
  const [eraserSize,  setEraserSize]  = useState(20);
  const [isEraser,    setIsEraser]    = useState(false);
  const [openPanel,   setOpenPanel]   = useState(null); // 'color'|'penSize'|'eraserSize'|null
  const [live, setLive] = useState(null);
  const drawing = useRef(false);
  const pts     = useRef([]);

  const buildD = ps => ps.reduce((d, p, i) => d + (i === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`), '');

  const onTouchStart = e => {
    if (openPanel) { setOpenPanel(null); return; }
    drawing.current = true;
    const { locationX: x, locationY: y } = e.nativeEvent.touches[0];
    pts.current = [{ x, y }];
    setLive({ d: `M${x},${y}`, color: isEraser ? theme.bg : penColor, size: isEraser ? eraserSize : penSize });
  };
  const onTouchMove = e => {
    if (!drawing.current) return;
    const { locationX: x, locationY: y } = e.nativeEvent.touches[0];
    pts.current.push({ x, y });
    setLive({ d: buildD(pts.current), color: isEraser ? theme.bg : penColor, size: isEraser ? eraserSize : penSize });
  };
  const onTouchEnd = () => {
    if (!drawing.current || !pts.current.length) return;
    drawing.current = false;
    onUpdate([...paths, { d: buildD(pts.current), color: isEraser ? theme.bg : penColor, size: isEraser ? eraserSize : penSize }]);
    setLive(null);
    pts.current = [];
  };

  const toggle = panel => setOpenPanel(v => v === panel ? null : panel);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Canvas */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: canvasHeight }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {paths.map((p, i) => <Path key={i} d={p.d} stroke={p.color} strokeWidth={p.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
          {live && <Path d={live.d} stroke={live.color} strokeWidth={live.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </Svg>
      </View>

      {/* Popovers above toolbar */}
      {openPanel === 'color' && (
        <View style={[styles.drawPopover, { bottom: bottomOffset + 56, backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.popoverLabel, { color: theme.subtext }]}>pen color</Text>
          <ColorSlider color={penColor} onChange={c => { setPenColor(c); setIsEraser(false); }} />
        </View>
      )}
      {openPanel === 'penSize' && (
        <View style={[styles.drawPopover, { bottom: bottomOffset + 56, backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.popoverLabel, { color: theme.subtext }]}>pen size</Text>
          <View style={styles.sizeDotsRow}>
            {PEN_SIZES.map(s => (
              <TouchableOpacity key={s} onPress={() => { setPenSize(s); setIsEraser(false); setOpenPanel(null); }}
                style={[styles.sizeDotBtn, { borderColor: penSize === s && !isEraser ? accentColor : theme.border }]}>
                <View style={{ width: s + 2, height: s + 2, borderRadius: s, backgroundColor: penColor }} />
                <Text style={[styles.sizeCardLabel, { color: theme.subtext, marginTop: 4 }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {openPanel === 'eraserSize' && (
        <View style={[styles.drawPopover, { bottom: bottomOffset + 56, backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.popoverLabel, { color: theme.subtext }]}>eraser size</Text>
          <View style={styles.sizeDotsRow}>
            {ERASER_SIZES.map(s => (
              <TouchableOpacity key={s} onPress={() => { setEraserSize(s); setIsEraser(true); setOpenPanel(null); }}
                style={[styles.sizeDotBtn, { borderColor: eraserSize === s && isEraser ? accentColor : theme.border }]}>
                <View style={{ width: Math.min(s, 36), height: Math.min(s, 36), borderRadius: s, backgroundColor: theme.border }} />
                <Text style={[styles.sizeCardLabel, { color: theme.subtext, marginTop: 4 }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Draw toolbar */}
      <View style={[styles.drawToolbar, { bottom: bottomOffset, backgroundColor: theme.card, borderColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.fmtRow}>

            {/* Color pill */}
            <TouchableOpacity onPress={() => toggle('color')}
              style={[styles.fmtPill, { borderColor: openPanel === 'color' ? accentColor : theme.border, backgroundColor: openPanel === 'color' ? accentColor+'22' : 'transparent' }]}>
              <View style={[styles.colorPreviewDot, { backgroundColor: penColor }]} />
              <Text style={[styles.fmtPillText, { color: theme.subtext }]}>color</Text>
              <Text style={[styles.fmtChevron, { color: theme.subtext }]}>▾</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Pen size pill */}
            <TouchableOpacity onPress={() => toggle('penSize')}
              style={[styles.fmtPill, { borderColor: openPanel === 'penSize' ? accentColor : theme.border, backgroundColor: openPanel === 'penSize' ? accentColor+'22' : 'transparent' }]}>
              <View style={{ width: penSize + 2, height: penSize + 2, borderRadius: penSize, backgroundColor: penColor, marginRight: 4 }} />
              <Text style={[styles.fmtPillText, { color: theme.subtext }]}>pen</Text>
              <Text style={[styles.fmtChevron, { color: theme.subtext }]}>▾</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Eraser size pill */}
            <TouchableOpacity onPress={() => toggle('eraserSize')}
              style={[styles.fmtPill, { borderColor: openPanel === 'eraserSize' || isEraser ? accentColor : theme.border, backgroundColor: isEraser ? accentColor+'22' : 'transparent' }]}>
              <Text style={[styles.fmtPillText, { color: isEraser ? accentColor : theme.subtext }]}>eraser</Text>
              <Text style={[styles.fmtChevron, { color: theme.subtext }]}>▾</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Undo / Clear */}
            {[
              { label: 'undo',  fn: () => onUpdate(paths.slice(0, -1)) },
              { label: 'clear', fn: () => Alert.alert('clear', 'wipe all strokes?', [
                  { text: 'cancel', style: 'cancel' },
                  { text: 'clear', style: 'destructive', onPress: () => onUpdate([]) },
                ]) },
            ].map(b => (
              <TouchableOpacity key={b.label} onPress={b.fn}
                style={[styles.fmtBtn, { borderColor: theme.border }]}>
                <Text style={[styles.fmtBtnText, { color: theme.subtext }]}>{b.label}</Text>
              </TouchableOpacity>
            ))}

          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Rich text editor ─────────────────────────────────────────────────────────
function RichTextEditor({ segments, onChange, theme, editable }) {
  const updateSeg = useCallback((id, text) => {
    onChange(prev => prev.map(s => s.id === id ? { ...s, text } : s));
  }, [onChange]);

  return (
    <View>
      {segments.map((seg, idx) => (
        <TextInput
          key={seg.id}
          style={[
            styles.segInput,
            {
              color:      seg.fmt?.color      || theme.text,
              fontSize:   seg.fmt?.fontSize   || 16,
              fontFamily: seg.fmt?.fontFamily || undefined,
              fontWeight: seg.fmt?.fontWeight || 'normal',
              fontStyle:  seg.fmt?.fontStyle  || 'normal',
            },
          ]}
          value={seg.text}
          onChangeText={t => updateSeg(seg.id, t)}
          multiline
          textAlignVertical="top"
          editable={editable}
          placeholder={idx === 0 ? 'write anything…' : ''}
          placeholderTextColor={theme.subtext}
          scrollEnabled={false}
          blurOnSubmit={false}
        />
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function JournalEntryScreen({ entry, onClose }) {
  const insets = useSafeAreaInsets();

  const parseState = () => {
    try {
      const s = entry.blocks ? JSON.parse(entry.blocks) : null;
      if (s?.segments) return { segments: s.segments, paths: s.paths ?? [], photos: s.photos ?? [] };
      const content = s?.content ?? entry.content ?? '';
      return { segments: [{ id: '1', text: content, fmt: {} }], paths: [], photos: [] };
    } catch {
      return { segments: [{ id: '1', text: entry.content ?? '', fmt: {} }], paths: [], photos: [] };
    }
  };

  const init = parseState();
  const [segments, setSegments] = useState(init.segments);
  const [paths,    setPaths]    = useState(init.paths);
  const [photos,   setPhotos]   = useState(init.photos);
  const [title,    setTitle]    = useState(entry.title || '');
  const [fmt,      setFmt]      = useState({});
  const [drawMode, setDrawMode] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [pageH,    setPageH]    = useState(600);
  const { theme, accentColor }  = useTheme();

  const onFmtChange = useCallback((newFmt) => {
    setFmt(newFmt);
    setSegments(prev => {
      const last = prev[prev.length - 1];
      if (last?.text === '') return [...prev.slice(0, -1), { ...last, fmt: newFmt }];
      return [...prev, { id: Date.now().toString(), text: '', fmt: newFmt }];
    });
  }, []);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('permission needed', 'allow photo access in settings.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) setPhotos(p => [...p, ...result.assets.map(a => ({ uri: a.uri }))]);
  };

  const removePhoto = idx => Alert.alert('remove photo', 'remove this photo?', [
    { text: 'cancel', style: 'cancel' },
    { text: 'remove', style: 'destructive', onPress: () => setPhotos(p => p.filter((_, i) => i !== idx)) },
  ]);

  const save = async () => {
    setSaving(true);
    const textContent = segments.map(s => s.text).join('');
    const { error } = await supabase
      .from('journal_entries')
      .update({
        title: title.trim(),
        content: textContent,
        blocks: JSON.stringify({ segments, paths, photos }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', entry.id);
    setSaving(false);
    if (error) Alert.alert('save failed', error.message);
    else onClose();
  };

  const drawToolbarBottom = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.headerBtn, { color: theme.subtext }]}>← back</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={pickPhoto}>
              <Text style={[styles.headerAction, { color: theme.subtext }]}>📎</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDrawMode(v => !v)}
              style={[styles.modeToggle, { backgroundColor: drawMode ? accentColor : theme.card, borderColor: drawMode ? accentColor : theme.border }]}
            >
              <Text style={[styles.modeToggleText, { color: drawMode ? '#fff' : theme.subtext }]}>
                {drawMode ? '✏︎ draw on' : '✏︎ draw'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={saving}>
              <Text style={[styles.saveBtn, { color: accentColor, opacity: saving ? 0.5 : 1 }]}>
                {saving ? 'saving…' : 'save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Format toolbar — write mode only */}
        {!drawMode && (
          <FormatToolbar fmt={fmt} onChange={onFmtChange} accentColor={accentColor} theme={theme} />
        )}

        {/* Page */}
        <View style={{ flex: 1 }} onLayout={e => setPageH(e.nativeEvent.layout.height)}>
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEnabled={!drawMode}
          >
            <TextInput
              style={[styles.titleInput, { color: theme.text, borderBottomColor: theme.border }]}
              placeholder="title"
              placeholderTextColor={theme.subtext}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!drawMode}
            />

            {photos.length > 0 && (
              <View style={styles.photoRow}>
                {photos.map((p, i) => (
                  <TouchableOpacity key={i} onLongPress={() => removePhoto(i)}>
                    <Image source={{ uri: p.uri }} style={styles.photoThumb} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <RichTextEditor
              segments={segments}
              onChange={setSegments}
              theme={theme}
              editable={!drawMode}
            />
            <View style={{ height: 200 }} />
          </ScrollView>

          {drawMode && (
            <DrawCanvas
              paths={paths}
              onUpdate={setPaths}
              theme={theme}
              accentColor={accentColor}
              canvasHeight={pageH}
              bottomOffset={drawToolbarBottom}
            />
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerBtn:       { fontSize: 15 },
  headerRight:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAction:    { fontSize: 18 },
  modeToggle:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5 },
  modeToggleText:  { fontSize: 13, fontWeight: '600' },
  saveBtn:         { fontSize: 15, fontWeight: '700' },

  formatBar:       { borderBottomWidth: 0.5, paddingVertical: 6, paddingHorizontal: 12 },
  fmtRow:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fmtPill:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, gap: 4 },
  fmtPillText:     { fontSize: 13, fontWeight: '500' },
  fmtChevron:      { fontSize: 10 },
  fmtBtn:          { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center', minWidth: 34 },
  fmtBtnText:      { fontSize: 13, fontWeight: '500' },
  colorPreviewDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#555' },
  divider:         { width: 0.5, height: 20, marginHorizontal: 2 },

  // Popovers
  popover:         { marginHorizontal: 12, marginTop: 0, borderRadius: 14, borderWidth: 0.5, padding: 14, zIndex: 200 },
  drawPopover:     { position: 'absolute', left: 12, right: 12, borderRadius: 14, borderWidth: 0.5, padding: 14, zIndex: 200 },
  popoverLabel:    { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },

  // Font grid
  fontGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fontCard:        { width: (SW - 80) / 3 - 6, borderRadius: 12, borderWidth: 0.5, padding: 10, alignItems: 'center', gap: 4 },
  fontCardPreview: { fontSize: 22, fontWeight: '600' },
  fontCardLabel:   { fontSize: 11 },

  // Size grid
  sizeGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeCard:        { width: (SW - 80) / 4 - 6, borderRadius: 12, borderWidth: 0.5, padding: 10, alignItems: 'center', gap: 2 },
  sizeCardText:    { fontWeight: '600' },
  sizeCardLabel:   { fontSize: 11 },

  // Size dots (pen/eraser)
  sizeDotsRow:     { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  sizeDotBtn:      { alignItems: 'center', padding: 8, borderRadius: 10, borderWidth: 0.5, minWidth: 44 },

  // Color slider
  sliderRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sliderTrack:     { height: 20, borderRadius: 10, justifyContent: 'center', overflow: 'visible' },
  sliderThumb:     { position: 'absolute', width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, elevation: 5 },
  sliderPreview:   { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#555' },

  scroll:          { flex: 1, paddingHorizontal: 20 },
  titleInput:      { fontSize: 24, fontWeight: '700', paddingVertical: 16, borderBottomWidth: 0.5, marginBottom: 16, letterSpacing: -0.5 },
  segInput:        { lineHeight: 26, paddingTop: 2, paddingRight: 8 },

  photoRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  photoThumb:      { width: 90, height: 90, borderRadius: 10 },

  drawToolbar:     { position: 'absolute', left: 0, right: 0, borderTopWidth: 0.5, paddingVertical: 8, paddingHorizontal: 12 },
});