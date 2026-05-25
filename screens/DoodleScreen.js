import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

const BRUSH_SIZES = [2, 4, 8, 14];

export default function DoodleScreen({ onSave, onClose }) {
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const { accentColor } = useTheme();
  const isDrawing = useRef(false);
  const pointsRef = useRef([]);

  const getColor = () => isEraser ? '#1a1a1a' : selectedColor;
  const getSize = () => isEraser ? brushSize * 3 : brushSize;

  const buildPath = (points) => {
    if (points.length === 0) return '';
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L${points[i].x},${points[i].y}`;
    }
    return d;
  };

  const handleTouchStart = (e) => {
    isDrawing.current = true;
    const touch = e.nativeEvent.touches[0];
    const point = { x: touch.locationX, y: touch.locationY };
    pointsRef.current = [point];
    setCurrentPath({
      d: `M${point.x},${point.y}`,
      color: getColor(),
      size: getSize(),
    });
  };

  const handleTouchMove = (e) => {
    if (!isDrawing.current) return;
    const touch = e.nativeEvent.touches[0];
    const point = { x: touch.locationX, y: touch.locationY };
    pointsRef.current = [...pointsRef.current, point];
    setCurrentPath({
      d: buildPath(pointsRef.current),
      color: getColor(),
      size: getSize(),
    });
  };

  const handleTouchEnd = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (pointsRef.current.length > 0) {
      const newPath = {
        d: buildPath(pointsRef.current),
        color: getColor(),
        size: getSize(),
      };
      setPaths(prev => [...prev, newPath]);
      setCurrentPath(null);
      pointsRef.current = [];
    }
  };

  const undo = () => setPaths(prev => prev.slice(0, -1));

  const clear = () => {
    Alert.alert('clear canvas', 'erase everything?', [
      { text: 'cancel', style: 'cancel' },
      { text: 'clear', style: 'destructive', onPress: () => setPaths([]) }
    ]);
  };

  const handleSave = () => {
    if (paths.length === 0) {
      Alert.alert('empty canvas', 'draw something first!');
      return;
    }
    onSave(paths);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelBtn}>cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>doodle 🎨</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: accentColor }]}>add to entry</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas */}
      <View
        style={styles.canvas}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {paths.map((path, index) => (
            <Path
              key={index}
              d={path.d}
              stroke={path.color}
              strokeWidth={path.size}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath && (
            <Path
              d={currentPath.d}
              stroke={currentPath.color}
              strokeWidth={currentPath.size}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        {/* Colors */}
        <View style={styles.toolRow}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorDot, {
                backgroundColor: color,
                borderWidth: selectedColor === color && !isEraser ? 3 : 1,
                borderColor: selectedColor === color && !isEraser ? accentColor : '#444',
                transform: [{ scale: selectedColor === color && !isEraser ? 1.2 : 1 }]
              }]}
              onPress={() => { setSelectedColor(color); setIsEraser(false); }}
            />
          ))}
        </View>

        {/* Brush sizes + tools */}
        <View style={styles.toolRow}>
          {BRUSH_SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.brushBtn, {
                backgroundColor: brushSize === size ? accentColor + '33' : '#1a1a1a',
                borderColor: brushSize === size ? accentColor : '#444',
              }]}
              onPress={() => setBrushSize(size)}
            >
              <View style={{
                width: size + 4,
                height: size + 4,
                borderRadius: (size + 4) / 2,
                backgroundColor: isEraser ? '#888' : selectedColor,
              }} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.toolBtn, {
              backgroundColor: isEraser ? accentColor + '33' : '#1a1a1a',
              borderColor: isEraser ? accentColor : '#444',
            }]}
            onPress={() => setIsEraser(!isEraser)}
          >
            <Text style={styles.toolBtnText}>eraser</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, { backgroundColor: '#1a1a1a', borderColor: '#444' }]}
            onPress={undo}
          >
            <Text style={styles.toolBtnText}>undo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, { backgroundColor: '#1a1a1a', borderColor: '#dc2626' }]}
            onPress={clear}
          >
            <Text style={[styles.toolBtnText, { color: '#dc2626' }]}>clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cancelBtn: { color: '#888', fontSize: 15 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  saveBtn: { fontSize: 15, fontWeight: '700' },
  canvas: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 12,
    backgroundColor: '#111',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  brushBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toolBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  toolBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});