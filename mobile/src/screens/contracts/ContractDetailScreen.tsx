import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
  Modal, TextInput, Image, ActivityIndicator, Share, Linking,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { contractService } from '../../services/contractService';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';
import { API_BASE_URL } from '../../config/api';
import { BRAND, brandCss, brandHeaderHtml, brandFooterHtml } from '../../utils/brandTemplate';
import {
  rateLabel, ratePer, rateShort, remainingTerm, termLength, normaliseContractType,
} from '../../utils/contractTerm';

const fmtDate = (d: any) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const generateContractHtml = (contract: any) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Bricolage Grotesque', serif; color: #333; }
  ${brandCss}
  .body { padding: 30px 40px 16px; }
  .doc-title { font-size: 26px; font-weight: 800; color: #232B38; text-transform: uppercase; }
  .doc-num { font-size: 12px; color: #666; margin-top: 2px; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px; border-top: 2px solid #eee; padding-top: 8px; }
  .field { padding: 12px 0; border-bottom: 1px solid #eee; }
  .field .lbl { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .field .value { font-size: 14px; font-weight: 600; color: #222; margin-top: 3px; }
  .highlight { background: #F4F9FE; border: 1px solid #d8ecfb; border-radius: 8px; padding: 16px 20px; margin: 24px 0; display: flex; justify-content: space-between; }
  .highlight .h-item .lbl { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .highlight .h-item .value { font-size: 18px; font-weight: 800; color: #232B38; margin-top: 3px; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 44px; gap: 60px; }
  .sign { flex: 1; border-top: 1.5px solid #333; padding-top: 8px; font-size: 11px; color: #666; text-align: center; }
</style></head><body>
  ${brandHeaderHtml}
  <div class="body">
    <div class="doc-title">Contract Agreement</div>
    <div class="doc-num">#${contract.contractNumber || contract._id || ''}</div>
    <div class="grid">
      <div class="field"><div class="lbl">Client</div><div class="value">${contract.companyName || contract.customerName || '—'}</div></div>
      <div class="field"><div class="lbl">Contact Person</div><div class="value">${contract.contactPerson || '—'}</div></div>
      <div class="field"><div class="lbl">Contract Type</div><div class="value">${normaliseContractType(contract.contractType)}</div></div>
      <div class="field"><div class="lbl">Vehicle</div><div class="value">${contract.vehicleName || contract.vehiclePlate || contract.vehicleInfo || '—'}</div></div>
      <div class="field"><div class="lbl">Start Date</div><div class="value">${fmtDate(contract.startDate)}</div></div>
      <div class="field"><div class="lbl">End Date</div><div class="value">${fmtDate(contract.endDate)}</div></div>
      <div class="field"><div class="lbl">Duration</div><div class="value">${termLength(contract) || '—'}</div></div>
      <div class="field"><div class="lbl">Payment Method</div><div class="value">${contract.paymentMethod || '—'}</div></div>
      <div class="field"><div class="lbl">Status</div><div class="value">${(contract.status || 'active').toUpperCase()}</div></div>
    </div>
    <div class="highlight">
      <div class="h-item"><div class="lbl">${rateLabel(contract.rateUnit)}</div><div class="value">AED ${Number(contract.monthlyRate || contract.amount || 0).toLocaleString()} <span style="font-size:11px;font-weight:600;color:#666">${ratePer(contract.rateUnit)}</span></div></div>
      <div class="h-item"><div class="lbl">Total Contract Value</div><div class="value">AED ${Number(contract.totalValue || contract.value || 0).toLocaleString()}</div></div>
    </div>
    <div class="sign-row">
      <div class="sign">${BRAND.shortName} — Authorized Signature</div>
      <div class="sign">Client — Authorized Signature</div>
    </div>
  </div>
  ${brandFooterHtml}
</body></html>`;

const SIGNATURE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  not_sent: { label: 'Not sent', color: colors.textSecondary, icon: 'draw-pen' },
  sent: { label: 'Awaiting signature', color: colors.info, icon: 'send-clock-outline' },
  viewed: { label: 'Viewed by client', color: colors.warning, icon: 'eye-check-outline' },
  signed: { label: 'Signed', color: colors.success, icon: 'check-decagram' },
  declined: { label: 'Declined', color: colors.error, icon: 'close-octagon-outline' },
  cancelled: { label: 'Cancelled', color: colors.textSecondary, icon: 'cancel' },
};

const ContractDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [contract, setContract] = useState<any>(route.params.contract || null);
  const [loading, setLoading] = useState(!route.params.contract);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [signature, setSignature] = useState<any>(null);
  const [signLoading, setSignLoading] = useState(false);
  const [signSending, setSignSending] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  const fetchDocuments = async () => {
    try {
      const res = await contractService.getDocuments(id);
      setDocuments(res.data?.documents || res.data || []);
    } catch { }
  };

  const pickAndUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];
      setUploading(true);
      await contractService.uploadDocument(id, file.uri, file.name || 'signed-contract.pdf', 'signed_contract');
      fetchDocuments();
      fetchContract();
      Alert.alert('Uploaded', 'Signed contract uploaded successfully');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const generateAndSharePdf = async (share = false) => {
    if (!contract) return;
    setPdfLoading(true);
    let webWin: any = null;
    if (Platform.OS === 'web') webWin = window.open('', '_blank');
    try {
      const html = generateContractHtml(contract);
      if (Platform.OS === 'web') {
        if (!webWin) { window.alert('Please allow pop-ups to download the contract PDF.'); return; }
        webWin.document.write(html);
        webWin.document.close();
        webWin.focus();
        setTimeout(() => webWin.print(), 400);
      } else if (!share) {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Contract', UTI: 'com.adobe.pdf' });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (err: any) {
      if (webWin) { try { webWin.close(); } catch { } }
      if (Platform.OS === 'web') window.alert(err.message || 'Failed to generate PDF');
      else Alert.alert('Error', err.message || 'Failed to generate PDF');
    } finally { setPdfLoading(false); }
  };

  const fetchContract = async () => {
    try { const r = await contractService.getById(id); setContract(r.data?.data || r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContract(); fetchDocuments(); }, [id]);

  // Re-fetch when returning from edit form
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { fetchContract(); fetchDocuments(); });
    return unsub;
  }, [navigation, id]);

  const openSignatureModal = async () => {
    setSignModalVisible(true);
    setSignature(contract.signature || null);
    setRecipientPhone(contract.signature?.sentToPhone || contract.contactPhone || '');
    setNotifyPhone(await AsyncStorage.getItem('signatureNotifyPhone') || '');
    setSignLoading(true);
    try {
      const r = await contractService.getSignature(id);
      setSignature(r.data?.data || null);
    } catch (e) { console.error(e); }
    finally { setSignLoading(false); }
  };

  const handleSendForSignature = async () => {
    setSignSending(true);
    try {
      const r = await contractService.sendForSignature(id, {
        phone: recipientPhone || undefined,
        notifyPhone: notifyPhone || undefined,
      });
      await AsyncStorage.setItem('signatureNotifyPhone', notifyPhone);
      const data = r.data?.data;
      setSignature({
        ...data.signature,
        signUrl: data.signUrl,
        whatsappUrl: data.whatsappUrl,
        shareMessage: data.shareMessage,
      });
      fetchContract();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send for signature');
    } finally { setSignSending(false); }
  };

  const handleCancelSignature = async () => {
    try {
      await contractService.cancelSignature(id);
      setSignature((prev: any) => ({ ...prev, status: 'cancelled', signUrl: null }));
      fetchContract();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to cancel link');
    }
  };

  // Opens WhatsApp with the chat and message pre-filled; the user presses send.
  const handleOpenWhatsApp = async () => {
    if (!signature?.whatsappUrl) return;
    try {
      await Linking.openURL(signature.whatsappUrl);
    } catch {
      Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp. Copy the link and send it another way.');
    }
  };

  // Prints the signed contract - signature already drawn into the document.
  const handleViewSignedDocument = async () => {
    try {
      const r = await contractService.getSignedDocument(id);
      const html = r.data?.data?.html;
      if (!html) { Alert.alert('Not available', 'No signed contract found yet.'); return; }
      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (!win) { window.alert('Please allow pop-ups to view the signed contract.'); return; }
        win.document.write(html);
        win.document.close();
        win.focus();
      } else {
        await Print.printAsync({ html });
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load the signed contract');
    }
  };

  const handleCopyLink = async () => {
    if (!signature?.signUrl) return;
    await Clipboard.setStringAsync(signature.signUrl);
    Alert.alert('Copied', 'Signing link copied to clipboard.');
  };

  const handleCopyMessage = async () => {
    if (!signature?.shareMessage && !signature?.signUrl) return;
    await Clipboard.setStringAsync(signature.shareMessage || signature.signUrl);
    Alert.alert('Copied', 'Full message copied to clipboard.');
  };

  // Native share sheet - SMS, email, Telegram, anything installed.
  const handleShareSignUrl = async () => {
    if (!signature?.signUrl) return;
    try {
      await Share.share({
        message: signature.shareMessage || `Please review and sign your contract:\n${signature.signUrl}`,
        url: signature.signUrl,
      });
    } catch { /* user dismissed the share sheet */ }
  };

  const handleDelete = () => Alert.alert('Delete Contract', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete', style: 'destructive', onPress: async () => {
        try { await contractService.delete(id); navigation.goBack(); }
        catch { Alert.alert('Error', 'Failed to delete'); }
      }
    },
  ]);

  if (loading || !contract) return <LoadingScreen />;

  const rows = [
    { icon: 'pound', label: 'Contract #', value: contract.contractNumber },
    { icon: 'domain', label: 'Company', value: contract.companyName },
    { icon: 'card-account-details-outline', label: 'Trade License', value: contract.tradeLicenseNo },
    { icon: 'account-outline', label: 'Contact Person', value: contract.contactPerson },
    { icon: 'phone-outline', label: 'Contact Phone', value: contract.contactPhone },
    { icon: 'car-outline', label: 'Vehicle', value: contract.vehicleName || contract.vehiclePlate },
    {
      icon: normaliseContractType(contract.contractType) === 'With Driver' ? 'account-tie' : 'steering',
      label: 'Contract Type',
      value: normaliseContractType(contract.contractType),
    },
    { icon: 'calendar-start', label: 'Start Date', value: fmtDate(contract.startDate) },
    { icon: 'calendar-end', label: 'End Date', value: fmtDate(contract.endDate) },
    { icon: 'timer-sand', label: 'Duration', value: termLength(contract) },
    { icon: 'cash', label: rateLabel(contract.rateUnit), value: contract.amount ? `AED ${Number(contract.amount).toLocaleString()} ${ratePer(contract.rateUnit)}` : null },
    { icon: 'shield-lock-outline', label: 'Security Deposit', value: contract.securityDeposit ? `AED ${Number(contract.securityDeposit).toLocaleString()}` : null },
  ].filter(r => r.value && r.value !== '—');

  const term = remainingTerm(contract.endDate);
  const sigStatus: string = contract.signature?.status || 'not_sent';
  const sigMeta = SIGNATURE_LABELS[sigStatus] || SIGNATURE_LABELS.not_sent;
  const modalStatus: string = signature?.status || 'not_sent';
  const modalMeta = SIGNATURE_LABELS[modalStatus] || SIGNATURE_LABELS.not_sent;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="file-document-outline" size={32} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>{contract.companyName || contract.contractNumber || 'Contract'}</Text>
        {contract.amount && (
          <Text style={styles.headerAmount}>
            AED {Number(contract.amount).toLocaleString()}{rateShort(contract.rateUnit)}
          </Text>
        )}
        <View style={styles.headerMetaRow}>
          {contract.status && <StatusBadge status={contract.status} />}
          {/* Countdown sits beside the status so it reads as one line, not a
              second block of chrome. */}
          {!!term && (
            <View style={[styles.termChip, term.expired && styles.termChipExpired, term.urgent && styles.termChipUrgent]}>
              <Text style={[styles.termChipText, (term.expired || term.urgent) && { color: '#fff' }]}>
                {term.label}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => generateAndSharePdf(false)} disabled={pdfLoading}>
          <Icon name="file-pdf-box" size={18} color={colors.white} />
          <Text style={[styles.actionText, { color: colors.white }]}>{pdfLoading ? 'Wait...' : 'PDF'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={() => generateAndSharePdf(true)} disabled={pdfLoading}>
          <Icon name="share-variant-outline" size={18} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('ContractForm', { contract })}>
          <Icon name="pencil-outline" size={18} color={colors.info} />
          <Text style={[styles.actionText, { color: colors.info }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={openSignatureModal}>
          <Icon name={sigMeta.icon as any} size={18} color={sigMeta.color} />
          <Text style={[styles.actionText, { color: sigMeta.color }]}>
            {sigStatus === 'signed' ? 'Signed' : 'E-Sign'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={handleDelete}>
          <Icon name="delete-outline" size={18} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {sigStatus !== 'not_sent' && (
        <View style={[styles.sigBanner, { borderLeftColor: sigMeta.color }]}>
          <Icon name={sigMeta.icon as any} size={18} color={sigMeta.color} />
          <Text style={styles.sigBannerText}>
            {sigStatus === 'signed'
              ? `Signed by ${contract.signature?.signerName || 'client'} on ${fmtDate(contract.signature?.signedAt)}`
              : sigMeta.label}
          </Text>
        </View>
      )}

      {/* Full contract template preview button */}
      <TouchableOpacity
        style={styles.viewContractBtn}
        onPress={() => navigation.navigate('ContractTemplate', { id: contract._id, contract })}
        activeOpacity={0.8}
      >
        <Icon name="file-document-edit-outline" size={20} color={colors.white} />
        <Text style={styles.viewContractText}>View / Edit Full Contract</Text>
      </TouchableOpacity>

      <Card style={{ marginHorizontal: spacing.md }}>
        <Text style={styles.section}>Contract Details</Text>
        {rows.map((r, i) => (
          <View key={i} style={[styles.row, i < rows.length - 1 && styles.border]}>
            <View style={styles.left}>
              <Icon name={r.icon} size={18} color={colors.textSecondary} />
              <Text style={styles.label}>{r.label}</Text>
            </View>
            <Text style={styles.val}>{r.value}</Text>
          </View>
        ))}
      </Card>

      {/* Signed Contract Documents */}
      <Card style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
        <Text style={styles.section}>Signed Contract</Text>
        {documents.length > 0 && (
          <View style={{ gap: 8, marginBottom: spacing.sm }}>
            {documents.map((doc: any, i: number) => {
              const docUrl = doc.url?.startsWith('http') ? doc.url : `${API_BASE_URL.replace('/api', '')}${doc.url}`;
              return (
                <TouchableOpacity key={i} style={styles.docItem} onPress={() => Linking.openURL(docUrl)}>
                  <Icon name={doc.url?.endsWith('.pdf') ? 'file-pdf-box' : 'file-image-outline'} size={22} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle} numberOfLines={1}>{doc.title || 'Document'}</Text>
                    <Text style={styles.docDate}>{doc.uploadDate ? fmtDate(doc.uploadDate) : ''}</Text>
                  </View>
                  <Icon name="open-in-new" size={16} color={colors.textLight} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <TouchableOpacity style={styles.uploadBtn} onPress={pickAndUploadDocument} disabled={uploading} activeOpacity={0.8}>
          <Icon name="upload" size={18} color={colors.primary} />
          <Text style={styles.uploadBtnText}>{uploading ? 'Uploading...' : 'Upload Signed Contract'}</Text>
        </TouchableOpacity>
      </Card>

      {/* Remote e-Signature Modal */}
      <Modal visible={signModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="draw-pen" size={22} color={colors.primary} />
              <Text style={styles.modalTitle}>Remote e-Signature</Text>
            </View>

            {signLoading ? (
              <ActivityIndicator style={{ marginVertical: spacing.xl }} color={colors.primary} />
            ) : (
              <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
                <View style={[styles.sigStatusPill, { backgroundColor: modalMeta.color + '1A' }]}>
                  <Icon name={modalMeta.icon as any} size={16} color={modalMeta.color} />
                  <Text style={[styles.sigStatusText, { color: modalMeta.color }]}>{modalMeta.label}</Text>
                </View>

                {modalStatus === 'signed' ? (
                  <>
                    <Text style={styles.modalHint}>
                      Signed by {signature?.signerName} on {fmtDate(signature?.signedAt)}
                    </Text>
                    {!!signature?.signatureImage && (
                      <View style={styles.sigImageBox}>
                        <Image
                          source={{ uri: signature.signatureImage }}
                          style={{ width: '100%', height: 110 }}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                    <TouchableOpacity style={styles.signedDocBtn} onPress={handleViewSignedDocument}>
                      <Icon name="file-document-outline" size={17} color="#fff" />
                      <Text style={styles.signedDocText}>View / print signed contract</Text>
                    </TouchableOpacity>
                    <Text style={styles.auditText}>
                      Sent {fmtDate(signature?.sentAt)}
                      {signature?.viewedAt ? ` · Viewed ${fmtDate(signature.viewedAt)}` : ''}
                      {signature?.ipAddress ? ` · IP ${signature.ipAddress}` : ''}
                    </Text>
                  </>
                ) : (
                  <>
                    {modalStatus === 'declined' && (
                      <Text style={[styles.modalHint, { color: colors.error }]}>
                        Declined on {fmtDate(signature?.declinedAt)}
                        {signature?.declineReason ? ` — "${signature.declineReason}"` : ''}
                      </Text>
                    )}

                    <Text style={styles.inputLabel}>Client WhatsApp number</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={recipientPhone}
                      onChangeText={setRecipientPhone}
                      placeholder="+9715XXXXXXX"
                      keyboardType="phone-pad"
                      placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.inputLabel}>Notify me on</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={notifyPhone}
                      onChangeText={setNotifyPhone}
                      placeholder="+9715XXXXXXX"
                      keyboardType="phone-pad"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={styles.modalHint}>
                      You get a WhatsApp alert the moment the client submits.
                    </Text>

                    {!!signature?.signUrl && (
                      <View style={styles.linkBox}>
                        <Text style={styles.linkText} numberOfLines={2}>{signature.signUrl}</Text>

                        <TouchableOpacity style={styles.waBtn} onPress={handleOpenWhatsApp}>
                          <Icon name="whatsapp" size={18} color="#fff" />
                          <Text style={styles.waBtnText}>Send on WhatsApp</Text>
                        </TouchableOpacity>

                        <View style={styles.linkActions}>
                          <TouchableOpacity style={styles.linkBtn} onPress={handleCopyLink}>
                            <Icon name="content-copy" size={15} color={colors.primary} />
                            <Text style={styles.linkBtnText}>Copy link</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.linkBtn} onPress={handleCopyMessage}>
                            <Icon name="text-box-outline" size={15} color={colors.primary} />
                            <Text style={styles.linkBtnText}>Copy message</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.linkBtn} onPress={handleShareSignUrl}>
                            <Icon name="share-variant-outline" size={15} color={colors.primary} />
                            <Text style={styles.linkBtnText}>Share</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.linkActions}>
                          <TouchableOpacity
                            style={styles.linkBtn}
                            onPress={() => WebBrowser.openBrowserAsync(signature.signUrl)}
                          >
                            <Icon name="open-in-new" size={15} color={colors.primary} />
                            <Text style={styles.linkBtnText}>Preview</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.linkBtn} onPress={handleCancelSignature}>
                            <Icon name="cancel" size={15} color={colors.error} />
                            <Text style={[styles.linkBtnText, { color: colors.error }]}>Cancel link</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSignModalVisible(false)}>
                <Text style={{ color: colors.textSecondary, fontFamily: fonts.semiBold }}>Close</Text>
              </TouchableOpacity>
              {modalStatus !== 'signed' && (
                <TouchableOpacity
                  style={[styles.modalConfirm, signSending && { opacity: 0.6 }]}
                  onPress={handleSendForSignature}
                  disabled={signSending || signLoading}
                >
                  <Text style={{ color: '#fff', fontFamily: fonts.semiBold }}>
                    {signSending ? 'Creating...' : signature?.signUrl ? 'New link' : 'Create signing link'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center', paddingVertical: spacing.xl, paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: { fontSize: fontSize.xl, fontFamily: fonts.bold, color: colors.white },
  headerAmount: { fontSize: fontSize.lg, color: colors.accent, fontFamily: fonts.extraBold, marginTop: 4, marginBottom: spacing.xs },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  termChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  termChipUrgent: { backgroundColor: colors.warning },
  termChipExpired: { backgroundColor: colors.error },
  termChipText: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.white },
  actions: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: borderRadius.full, ...shadows.sm,
  },
  actionText: { fontSize: fontSize.sm, fontFamily: fonts.semiBold },
  viewContractBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: '#7c3aed', marginHorizontal: spacing.md, marginBottom: spacing.md,
    paddingVertical: 14, borderRadius: borderRadius.md, ...shadows.md,
  },
  viewContractText: { fontSize: 15, fontFamily: fonts.bold, color: '#fff' },
  section: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm + 2 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  left: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginLeft: spacing.sm },
  val: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text, maxWidth: '50%', textAlign: 'right' },
  docItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: colors.background, borderRadius: borderRadius.md,
  },
  docTitle: { fontSize: fontSize.sm, fontFamily: fonts.medium, color: colors.text },
  docDate: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: borderRadius.md,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary,
  },
  uploadBtnText: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.primary },
  sigBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    padding: spacing.sm + 2, borderRadius: borderRadius.md,
    backgroundColor: colors.surface, borderLeftWidth: 4, ...shadows.sm,
  },
  sigBannerText: { flex: 1, fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  modalTitle: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text },
  modalHint: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 6 },
  inputLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary, marginTop: spacing.md, marginBottom: 6 },
  modalInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.text,
  },
  modalCancel: {
    flex: 1, alignItems: 'center', paddingVertical: 13,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  modalConfirm: {
    flex: 2, alignItems: 'center', paddingVertical: 13,
    borderRadius: 10, backgroundColor: colors.primary,
  },
  sigStatusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.full,
  },
  sigStatusText: { fontSize: 12, fontFamily: fonts.semiBold },
  sigImageBox: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.sm, marginTop: spacing.sm, backgroundColor: colors.background,
  },
  auditText: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: spacing.sm },
  signedDocBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: 12, marginTop: spacing.md,
  },
  signedDocText: { fontSize: fontSize.sm, fontFamily: fonts.bold, color: '#fff' },
  linkBox: {
    marginTop: spacing.md, padding: spacing.sm + 2,
    borderRadius: borderRadius.md, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
  },
  linkText: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
  linkActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  waBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#25D366', borderRadius: borderRadius.md,
    paddingVertical: 12, marginTop: spacing.sm,
  },
  waBtnText: { fontSize: fontSize.sm, fontFamily: fonts.bold, color: '#fff' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkBtnText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.primary },
});

export default ContractDetailScreen;
