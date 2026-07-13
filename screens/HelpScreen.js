import {
    StyleSheet, Text, View, TouchableOpacity, ScrollView,
    Modal, Linking, Alert, Platform,
  } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { useState } from 'react';
  import { useTheme } from '../context/ThemeContext';
  
  // ─── Country + helpline data ──────────────────────────────────────────────────
  // IMPORTANT: verify numbers periodically — helplines change.
  const COUNTRIES = [
    { code: 'IN', flag: '🇮🇳', name: 'India' },
    { code: 'US', flag: '🇺🇸', name: 'United States' },
    { code: 'UK', flag: '🇬🇧', name: 'United Kingdom' },
    { code: 'CA', flag: '🇨🇦', name: 'Canada' },
    { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  ];
  
  const CATEGORIES = [
    { key: 'mental',   label: 'mental health' },
    { key: 'teens',    label: 'teens' },
    { key: 'women',    label: 'women' },
    { key: 'children', label: 'children' },
    { key: 'lgbtq',    label: 'LGBTQ+' },
    { key: 'crisis',   label: 'emergency' },
  ];
  
  // Helplines, by country → category
  const HELPLINES = {
    IN: {
      mental: [
        { name: 'iCall',                  number: '9152987821',    hours: 'Mon–Sat, 8am–10pm' },
        { name: 'Vandrevala Foundation',  number: '18602662345',   hours: '24/7' },
        { name: 'AASRA',                  number: '9820466726',    hours: '24/7' },
        { name: 'NIMHANS Helpline',       number: '08046110007',   hours: '24/7' },
      ],
      teens: [
        { name: 'YourDOST',               number: '08047192222',   hours: '24/7, online chat' },
        { name: 'iCall (Youth)',          number: '9152987821',    hours: 'Mon–Sat, 8am–10pm' },
      ],
      women: [
        { name: 'Women Helpline',         number: '1091',          hours: '24/7' },
        { name: 'Domestic Abuse',         number: '181',           hours: '24/7' },
      ],
      children: [
        { name: 'Childline India',        number: '1098',          hours: '24/7' },
      ],
      lgbtq: [
        { name: 'iCall LGBTQ+',           number: '9152987821',    hours: 'Mon–Sat, 8am–10pm' },
      ],
      crisis: [
        { name: 'Emergency',              number: '112',           hours: '24/7' },
        { name: 'Police',                 number: '100',           hours: '24/7' },
        { name: 'Ambulance',              number: '102',           hours: '24/7' },
      ],
    },
    US: {
      mental: [
        { name: '988 Suicide & Crisis Lifeline', number: '988',     hours: '24/7' },
        { name: 'SAMHSA',                 number: '18006624357',   hours: '24/7' },
        { name: 'Crisis Text Line',       number: '741741',        hours: '24/7, text HOME' },
      ],
      teens: [
        { name: 'Teen Line',              number: '13108555000',   hours: '6pm–10pm PT' },
        { name: 'YouthLine',              number: '8779684644',    hours: '4pm–10pm PT' },
      ],
      women: [
        { name: 'National DV Hotline',    number: '18007997233',   hours: '24/7' },
        { name: 'RAINN (Sexual Assault)', number: '18006564673',   hours: '24/7' },
      ],
      children: [
        { name: 'Childhelp',              number: '18004224453',   hours: '24/7' },
      ],
      lgbtq: [
        { name: 'Trevor Project',         number: '18664887386',   hours: '24/7' },
        { name: 'Trans Lifeline',         number: '18775658860',   hours: '24/7' },
      ],
      crisis: [
        { name: 'Emergency',              number: '911',           hours: '24/7' },
      ],
    },
    UK: {
      mental: [
        { name: 'Samaritans',             number: '116123',        hours: '24/7' },
        { name: 'Mind',                   number: '03001233393',   hours: 'Mon–Fri, 9am–6pm' },
        { name: 'SHOUT (text)',           number: '85258',         hours: '24/7, text SHOUT' },
      ],
      teens: [
        { name: 'Childline',              number: '0800 1111',     hours: '24/7' },
        { name: 'YoungMinds Crisis',      number: '85258',         hours: '24/7, text YM' },
      ],
      women: [
        { name: "Women's Aid",            number: '08082000247',   hours: '24/7' },
        { name: 'Rape Crisis',            number: '08088029999',   hours: '24/7' },
      ],
      children: [
        { name: 'NSPCC',                  number: '08088005000',   hours: 'Mon–Fri, 8am–10pm' },
        { name: 'Childline',              number: '08001111',      hours: '24/7' },
      ],
      lgbtq: [
        { name: 'Switchboard LGBT+',      number: '08003304040',   hours: '10am–10pm' },
      ],
      crisis: [
        { name: 'Emergency',              number: '999',           hours: '24/7' },
        { name: 'Non-emergency',          number: '111',           hours: '24/7' },
      ],
    },
    CA: {
      mental: [
        { name: '988 Suicide Crisis',     number: '988',           hours: '24/7' },
        { name: 'Talk Suicide Canada',    number: '18334564566',   hours: '24/7' },
      ],
      teens: [
        { name: 'Kids Help Phone',        number: '18006686868',   hours: '24/7' },
      ],
      women: [
        { name: 'Assaulted Women',        number: '18664423432',   hours: '24/7' },
      ],
      children: [
        { name: 'Kids Help Phone',        number: '18006686868',   hours: '24/7' },
      ],
      lgbtq: [
        { name: 'LGBT YouthLine',         number: '18002680372',   hours: 'Sun–Fri, 4pm–9:30pm' },
      ],
      crisis: [
        { name: 'Emergency',              number: '911',           hours: '24/7' },
      ],
    },
    AU: {
      mental: [
        { name: 'Lifeline',               number: '131114',        hours: '24/7' },
        { name: 'Beyond Blue',            number: '1300224636',    hours: '24/7' },
      ],
      teens: [
        { name: 'Kids Helpline',          number: '1800551800',    hours: '24/7' },
        { name: 'headspace',              number: '1800650890',    hours: '9am–1am' },
      ],
      women: [
        { name: '1800RESPECT',            number: '1800737732',    hours: '24/7' },
      ],
      children: [
        { name: 'Kids Helpline',          number: '1800551800',    hours: '24/7' },
      ],
      lgbtq: [
        { name: 'QLife',                  number: '1800184527',    hours: '3pm–midnight' },
      ],
      crisis: [
        { name: 'Emergency',              number: '000',           hours: '24/7' },
      ],
    },
  };
  
  // ─── Helpline card ───────────────────────────────────────────────────────────
  function HelplineCard({ line, theme, accentColor }) {
    const call = async () => {
      const url = `tel:${line.number.replace(/\s/g, '')}`;
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert('Cannot place call', 'Your device does not support calling.');
        return;
      }
      Alert.alert(
        `Call ${line.name}?`,
        line.number,
        [
          { text: 'cancel', style: 'cancel' },
          { text: 'call', onPress: () => Linking.openURL(url) },
        ]
      );
    };
  
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={call}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardName, { color: theme.text }]}>{line.name}</Text>
          <Text style={[styles.cardNumber, { color: accentColor }]}>{line.number}</Text>
          <Text style={[styles.cardHours, { color: theme.subtext }]}>{line.hours}</Text>
        </View>
        <View style={[styles.callBtn, { backgroundColor: accentColor }]}>
          <Text style={styles.callBtnText}>call</Text>
        </View>
      </TouchableOpacity>
    );
  }
  
  // ─── Country picker modal ────────────────────────────────────────────────────
  function CountryPicker({ visible, onClose, selected, onSelect, theme, accentColor }) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.bg }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>select country</Text>
            {COUNTRIES.map(c => (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.countryRow,
                  { borderBottomColor: theme.border },
                  selected === c.code && { backgroundColor: accentColor + '22' },
                ]}
                onPress={() => { onSelect(c.code); onClose(); }}
              >
                <Text style={[styles.countryName, { color: theme.text }]}>{c.name}</Text>
                <Text style={styles.countryFlag}>{c.flag}</Text>
                {selected === c.code && (
                  <Text style={[styles.checkmark, { color: accentColor }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={onClose} style={[styles.modalClose, { borderColor: theme.border }]}>
              <Text style={[styles.modalCloseText, { color: theme.subtext }]}>close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
  
  // ─── Main screen ─────────────────────────────────────────────────────────────
  export default function HelpScreen() {
    const [country, setCountry]       = useState('IN');
    const [category, setCategory]     = useState('mental');
    const [pickerOpen, setPickerOpen] = useState(false);
    const { theme, accentColor }      = useTheme();
  
    const selectedCountry = COUNTRIES.find(c => c.code === country);
    const lines           = HELPLINES[country]?.[category] || [];
  
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
  
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>help</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            you're not alone. reach out.
          </Text>
        </View>
  
        {/* Country selector */}
        <TouchableOpacity
          style={[styles.countryPill, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setPickerOpen(true)}
        >
          <Text style={[styles.countryPillText, { color: theme.text }]}>
            {selectedCountry.name}
          </Text>
          <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
          <Text style={[styles.chevron, { color: theme.subtext }]}>▾</Text>
        </TouchableOpacity>
  
        {/* Category tabs */}
        <View style={[styles.tabsWrap, { borderBottomColor: theme.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {CATEGORIES.map(cat => {
              const active = category === cat.key;
              const available = (HELPLINES[country]?.[cat.key]?.length || 0) > 0;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  disabled={!available}
                  style={[
                    styles.tab,
                    { borderColor: theme.border, opacity: available ? 1 : 0.4 },
                    active && { backgroundColor: accentColor, borderColor: accentColor },
                  ]}
                >
                  <Text style={[styles.tabLabel, { color: active ? '#fff' : theme.subtext }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
  
        {/* Helpline list */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {lines.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                no helplines listed for this category yet.{'\n'}try another category.
              </Text>
            </View>
          ) : (
            lines.map((line, i) => (
              <HelplineCard key={i} line={line} theme={theme} accentColor={accentColor} />
            ))
          )}
  
          {/* Disclaimer */}
          <View style={[styles.disclaimer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.disclaimerText, { color: theme.subtext }]}>
              in immediate danger? call your local emergency number now.
              {'\n\n'}
              helplines may have wait times. text-based options are listed where available.
            </Text>
          </View>
  
          <View style={{ height: 120 }} />
        </ScrollView>
  
        <CountryPicker
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          selected={country}
          onSelect={setCountry}
          theme={theme}
          accentColor={accentColor}
        />
      </SafeAreaView>
    );
  }
  
  // ─── Styles ──────────────────────────────────────────────────────────────────
  const styles = StyleSheet.create({
    container:        { flex: 1 },
    header:           { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
    title:            { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
    subtitle:         { fontSize: 14, marginTop: 4 },
  
    countryPill:      { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, borderWidth: 0.5, gap: 8, marginBottom: 16 },
    countryFlag:      { fontSize: 20 },
    countryPillText:  { fontSize: 14, fontWeight: '600' },
    chevron:          { fontSize: 12 },
  
    tabsWrap:         { borderBottomWidth: 0.5 },
    tabsRow:          { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
    tab:              { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5, gap: 6 },
    tabIcon:          { fontSize: 14 },
    tabLabel:         { fontSize: 13, fontWeight: '600' },
  
    scroll:           { flex: 1 },
    scrollContent:    { padding: 20, paddingBottom: 120, gap: 10 },
  
    card:             { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 0.5, gap: 12 },
    cardName:         { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    cardNumber:       { fontSize: 18, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
    cardHours:        { fontSize: 12 },
    callBtn:          { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    callBtnText:      { color: '#fff', fontWeight: '700', fontSize: 13 },
  
    empty:            { padding: 40, alignItems: 'center' },
    emptyText:        { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  
    disclaimer:       { marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 0.5 },
    disclaimerText:   { fontSize: 12, lineHeight: 18 },
  
    // Modal
    modalOverlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    modalHandle:      { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalTitle:       { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    countryRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 0.5, gap: 12, borderRadius: 8 },
    countryName:      { fontSize: 16, fontWeight: '500', flex: 1 },
    checkmark:        { fontSize: 18, fontWeight: '700' },
    modalClose:       { marginTop: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 0.5, alignItems: 'center' },
    modalCloseText:   { fontSize: 14, fontWeight: '600' },
  });
