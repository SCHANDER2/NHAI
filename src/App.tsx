/**
 * NHAI Datalake 3.0 - Offline Secure Face Biometrics UI
 * File: App.tsx
 * Description: Master App Entry Point representing the NHAI Datalake 3.0 Biometrics Hub.
 *              Displays user enrollment profiles, offline logs cache status, and trigger controls.
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Alert 
} from 'react-native';
import { NhaiFaceCamera } from './components/NhaiFaceCamera';
import { OfflineDatabase, BiometricLog } from './services/OfflineDatabase';
import { SyncScheduler } from './services/SyncScheduler';

// Design system HSL palette
const COLORS = {
  bgMain: '#0b0f19',
  bgSurface: '#131c2e',
  primary: '#3b82f6',
  accent: '#8b5cf6',
  success: '#10b981',
  error: '#ef4444',
  textMain: '#f8fafc',
  textMuted: '#94a3b8',
  border: 'rgba(148, 163, 184, 0.12)'
};

export default function App() {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<string>('NHAI-EMP-5002');
  const [offlineLogs, setOfflineLogs] = useState<BiometricLog[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('Idle');

  // Load offline transactions queue on mount
  useEffect(() => {
    refreshLogs();
  }, []);

  const refreshLogs = () => {
    const data = OfflineDatabase.getAllLogs();
    setOfflineLogs(data);
  };

  const handleVerification = (log: BiometricLog) => {
    setCameraActive(false);
    refreshLogs();
    Alert.alert('Authentication Success', `User ${log.userId} securely authenticated offline.\nTransaction ID: ${log.id}`);
  };

  // Triggers the secure offline-to-online Sync & Purge process
  const triggerSyncAndPurge = async () => {
    setSyncStatus('Syncing with AWS...');
    const result = await SyncScheduler.executeSyncAndPurge();
    if (result.success) {
      setSyncStatus('Sync complete! Cache purged.');
      refreshLogs();
      Alert.alert('Sync & Purge Complete', `Successfully uploaded and purged ${result.count} biometric transactions from device.`);
    } else {
      setSyncStatus('Failed. Retaining offline cache.');
      Alert.alert('Sync Postponed', 'Device is currently in a zero-network zone. Offline transactions preserved securely.');
    }
  };

  const clearCache = () => {
    OfflineDatabase.clearAll();
    refreshLogs();
    Alert.alert('Cache Reset', 'Mock SQLite database cleared.');
  };

  if (cameraActive) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgMain }}>
        <NhaiFaceCamera 
          mockUserId={selectedUser} 
          onVerificationComplete={handleVerification} 
        />
        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={() => setCameraActive(false)}
        >
          <Text style={styles.closeText}>Cancel Scan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* 🏢 Header and Branding */}
        <View style={styles.header}>
          <Text style={styles.nhaiTitle}>NHAI DATALAKE 3.0</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>OFFLINE BIOMETRICS HUB</Text></View>
        </View>

        {/* 👤 Enrollment Selector Widget (Frosted Glassmorphism Card) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enrolled Personnel Profile</Text>
          <Text style={styles.cardDesc}>Select a target profile to authenticate under offline conditions:</Text>
          
          <View style={styles.profileRow}>
            <TouchableOpacity 
              style={[styles.profileBtn, selectedUser === 'NHAI-EMP-5002' && styles.profileBtnActive]}
              onPress={() => setSelectedUser('NHAI-EMP-5002')}
            >
              <Text style={styles.profileName}>Nitin Sharma</Text>
              <Text style={styles.profileId}>ID: NHAI-EMP-5002</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.profileBtn, selectedUser === 'NHAI-EMP-7881' && styles.profileBtnActive]}
              onPress={() => setSelectedUser('NHAI-EMP-7881')}
            >
              <Text style={styles.profileName}>Priya Patel</Text>
              <Text style={styles.profileId}>ID: NHAI-EMP-7881</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setCameraActive(true)}>
            <Text style={styles.primaryBtnText}>Launch Secure Face Scan</Text>
          </TouchableOpacity>
        </View>

        {/* 📊 Offline Queue Dashboard Card */}
        <View style={styles.card}>
          <View style={styles.queueHeader}>
            <Text style={styles.cardTitle}>Encrypted Offline Logs Queue</Text>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{offlineLogs.length}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>Transactions registered locally in secure SQLite waiting for sync:</Text>

          {offlineLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Offline cache is clear. Zero biometric data residues on disk.</Text>
            </View>
          ) : (
            offlineLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View>
                  <Text style={styles.logId}>{log.id} • {log.userId}</Text>
                  <Text style={styles.logMeta}>Time: {new Date(log.timestamp).toLocaleTimeString()} | Score: {(log.similarityScore * 100).toFixed(1)}%</Text>
                  <Text style={styles.logGPS}>GPS: {log.gpsCoordinates.lat.toFixed(4)}, {log.gpsCoordinates.lng.toFixed(4)}</Text>
                </View>
                <View style={[styles.statusBadge, log.status === 'VERIFIED' ? styles.statusSuccess : styles.statusFail]}>
                  <Text style={styles.statusText}>{log.status}</Text>
                </View>
              </View>
            ))
          )}

          {/* Sync Trigger Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={triggerSyncAndPurge}>
              <Text style={styles.secondaryBtnText}>Sync with AWS & Purge Cache</Text>
            </TouchableOpacity>

            {offlineLogs.length > 0 && (
              <TouchableOpacity style={styles.dangerBtn} onPress={clearCache}>
                <Text style={styles.dangerBtnText}>Reset Cache</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.syncStatusText}>Sync Status: {syncStatus}</Text>
        </View>

        {/* ℹ️ Technical Specifications Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>NHAI 7.0 Edge AI Framework Spec</Text>
          <Text style={styles.footerText}>• Core Algorithm: PFLD-Lite Landmark + MobileFaceNet (ncnn runtime)</Text>
          <Text style={styles.footerText}>• Execution Bridge: React Native JavaScript Interface (JSI)</Text>
          <Text style={styles.footerText}>• Compression Footprint: ~7.07 MB total binary size (INT8 quantized)</Text>
          <Text style={styles.footerText}>• Execution Speed: ~85ms average CPU-only inference</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgMain
  },
  container: {
    padding: 24,
    alignItems: 'center'
  },
  header: {
    alignItems: 'center',
    marginVertical: 32
  },
  nhaiTitle: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textMain,
    letterSpacing: -1
  },
  badge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1
  },
  card: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
  },
  cardTitle: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 6
  },
  cardDesc: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 16
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginBottom: 20
  },
  profileBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.bgMain,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  profileBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.05)'
  },
  profileName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMain
  },
  profileId: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMain
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  counterBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  counterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMain
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 24,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  logItem: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.bgMain,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  logId: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textMain
  },
  logMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4
  },
  logGPS: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 2
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  statusFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMain
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%'
  },
  secondaryBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center'
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary
  },
  dangerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center'
  },
  dangerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error
  },
  syncStatusText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 12,
    textAlign: 'center'
  },
  footer: {
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    marginBottom: 48
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textMain,
    marginBottom: 8
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 18
  },
  closeBtn: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 50,
    backgroundColor: COLORS.error
  },
  closeText: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: 'bold'
  }
});
