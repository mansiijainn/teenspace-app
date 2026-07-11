import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Defs, Filter, FeTurbulence, FeColorMatrix, Rect } from 'react-native-svg';
import { useMemo } from 'react';

const { width, height } = Dimensions.get('window');

// Generates a static noise pattern using SVG circles
// Pre-computed once for performance
function generateNoise(count = 250) {
  const dots = [];
  for (let i = 0; i < count; i++) {
    dots.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 0.8 + 0.3,
      o: Math.random() * 0.15 + 0.05,
    });
  }
  return dots;
}

export default function GrainOverlay({ opacity = 0.4, color = '#fff' }) {
  const dots = useMemo(() => generateNoise(), []);

  return (
    <View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {dots.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={color} fillOpacity={d.o} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
});