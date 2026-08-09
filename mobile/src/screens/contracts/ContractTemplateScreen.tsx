import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { contractService } from '../../services/contractService';
import { vehicleService } from '../../services/vehicleService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';
import { BRAND, brandCss, brandHeaderHtml, brandFooterHtml } from '../../utils/brandTemplate';

const fmtDate = (d: any) => {
    if (!d) return '____________________';
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const defaultTemplate = `
<h1 class="document-title">VEHICLE RENTAL AGREEMENT</h1>

<p>This Vehicle Rental Agreement (the "Agreement") is made and entered into on [Start Date] in Dubai, United Arab Emirates.</p>

<h2 class="section-title">PARTIES:</h2>

<p>1. ${BRAND.name}, a company registered under the laws of UAE with Trade License No. 1383686, having its registered office at Dubai, UAE (hereinafter referred to as the "Company")</p>

<p>2. [Client Company Name], a company registered under the laws of UAE with Trade License No. [Client Trade License No], represented by [Contact Person] (hereinafter referred to as the "Client")</p>

<h2 class="section-title">VEHICLE INFORMATION:</h2>

<p>The Company hereby rents to the Client the following vehicle without driver:</p>

<ul class="document-list">
<li>License Plate: [Vehicle License Plate]</li>
<li>Make / Model / Year: [Vehicle Make] [Vehicle Model] [Vehicle Year]</li>
</ul>

<h2 class="section-title">TERMS AND CONDITIONS:</h2>

<ul class="document-list">

<li><b>CONTRACT DURATION AND VALUE</b>
   <ul class="document-list">
   <li>Duration: From [Start Date] to [End Date]</li>
   <li>Renewal: Only upon mutual written consent of both Parties</li>
   <li>Monthly Rental Value: AED [Value]</li>
   <li>Security Deposit: AED [Security Deposit]</li>
   <li>Payment Method: Post-Dated Cheque (PDC) for full rental amount</li>
   </ul>
   <p>The Security Deposit shall be refundable within 21 days after vehicle return, subject to inspection, clearance of fines, Salik charges, and settlement of all outstanding dues.</p>
</li>

<li><b>VEHICLE HANDOVER AND CONDITION</b>
   <p>The Vehicle shall be delivered in good working and roadworthy condition. A vehicle handover report shall be signed by both Parties at delivery and return.</p>
</li>

<li><b>PAYMENT DEFAULT</b>
   <p>In case of cheque dishonor or delayed payment, the Company reserves the right to immediately repossess the Vehicle without prior notice and pursue legal remedies under UAE law.</p>
</li>

<li><b>CLIENT RESPONSIBILITIES</b>
   <ul class="document-list">
   <li>Fuel and petrol costs</li>
   <li>Salik (toll) charges</li>
   <li>Traffic fines, black points, parking violations, and impound charges. Must be paid within 3 days of violation.</li>
   <li>Compliance with all UAE traffic laws and regulations</li>
   </ul>
</li>

<li><b>MAINTENANCE AND REPAIRS</b>
   <ul class="document-list">
   <li><b>Routine Maintenance:</b> Client responsible for all routine and preventive maintenance.</li>
   <li><b>Major Repairs:</b> Company responsible only for major mechanical defects from normal wear and tear.</li>
   <li><b>Accidents:</b> Valid Dubai Police report mandatory. Insurance deductible borne by Client.</li>
   </ul>
</li>

<li><b>MILEAGE LIMIT</b>
   <p>Maximum 5,000 km per month. Excess charged at AED 1 per additional km.</p>
</li>

<li><b>PROHIBITED USE</b>
   <p>No illegal activities, racing, sub-renting, or transport outside Dubai without written consent.</p>
</li>

<li><b>TERMINATION</b>
   <ul class="document-list">
   <li>Early termination requires 30 days written notice and full settlement.</li>
   <li>Upon termination, Vehicle must be returned immediately and all dues settled.</li>
   </ul>
</li>

<li><b>GOVERNING LAW</b>
   <p>Governed by UAE laws. Courts of Dubai have exclusive jurisdiction.</p>
</li>

</ul>

<div class="sign-section">
<p><b>For ${BRAND.name}:</b><br/>
Name: ____________________<br/>
Signature: ________________<br/>
Date: ____________________</p>

<p><b>For [Client Company Name]:</b><br/>
Name: [Contact Person]<br/>
Signature: ________________<br/>
Date: ____________________</p>
</div>
`;

const ContractTemplateScreen = ({ route, navigation }: any) => {
    const { id, contract: routeContract } = route.params;
    const [contract, setContract] = useState<any>(routeContract || null);
    const [vehicle, setVehicle] = useState<any>(null);
    const [loading, setLoading] = useState(!routeContract);
    const [templateContent, setTemplateContent] = useState('');
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const [saving, setSaving] = useState(false);

    // Strip HTML to plain readable text for editing
    const htmlToPlainText = (html: string) => {
        return html
            .replace(/<h1[^>]*>/gi, '\n# ')
            .replace(/<h2[^>]*>/gi, '\n## ')
            .replace(/<\/h[12]>/gi, '\n')
            .replace(/<li><b>(.*?)<\/b>/gi, '\n• $1')
            .replace(/<li>/gi, '  • ')
            .replace(/<\/li>/gi, '')
            .replace(/<ul[^>]*>/gi, '')
            .replace(/<\/ul>/gi, '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p>/gi, '\n')
            .replace(/<\/p>/gi, '')
            .replace(/<b>(.*?)<\/b>/gi, '**$1**')
            .replace(/<div[^>]*>/gi, '\n')
            .replace(/<\/div>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };

    // Convert plain text back to HTML
    const plainTextToHtml = (text: string) => {
        const lines = text.split('\n');
        return lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            if (trimmed.startsWith('# ')) return `<h1 class="document-title">${trimmed.slice(2)}</h1>`;
            if (trimmed.startsWith('## ')) return `<h2 class="section-title">${trimmed.slice(3)}</h2>`;
            let processed = trimmed.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            if (trimmed.startsWith('• ') || trimmed.startsWith('  • '))
                return `<li>${processed.replace(/^•\s*/, '')}</li>`;
            return `<p>${processed}</p>`;
        }).join('\n');
    };

    const fetchContract = async () => {
        try {
            const r = await contractService.getById(id);
            setContract(r.data?.data || r.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchContract(); }, [id]);

    // Re-fetch when returning from edit form
    useEffect(() => {
        const unsub = navigation.addListener('focus', () => { fetchContract(); });
        return unsub;
    }, [navigation, id]);

    useEffect(() => {
        if (!contract) return;
        // Load vehicle info
        if (contract.vehicleId) {
            vehicleService.getById(contract.vehicleId).then((res: any) => {
                setVehicle(res.data?.data || res.data);
            }).catch(() => { });
        }
        // Use saved template or default
        const raw = contract.template?.content || defaultTemplate;
        setTemplateContent(raw);
    }, [contract]);

    const getFilledHtml = () => {
        let html = templateContent;
        html = html
            .replace(/\[Client Company Name\]/g, contract.companyName || '')
            .replace(/\[Client Trade License No\]/g, contract.tradeLicenseNo || '')
            .replace(/\[Contact Person\]/g, contract.contactPerson || '')
            .replace(/\[Start Date\]/g, fmtDate(contract.startDate))
            .replace(/\[End Date\]/g, fmtDate(contract.endDate))
            .replace(/\[Value\]/g, Number(contract.amount || contract.value || 0).toLocaleString())
            .replace(/\[Security Deposit\]/g, Number(contract.securityDeposit || 1000).toLocaleString())
            .replace(/\[Vehicle License Plate\]/g, vehicle?.plateNumber || vehicle?.licensePlate || contract.vehicleName || '')
            .replace(/\[Vehicle Make\]/g, vehicle?.make || '')
            .replace(/\[Vehicle Model\]/g, vehicle?.model || '')
            .replace(/\[Vehicle Year\]/g, vehicle?.year?.toString() || '');
        return html;
    };

    const getFullHtml = () => `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Bricolage Grotesque', serif; color: #333; font-size: 11px; line-height: 1.4; }
  ${brandCss}
  table.page-wrapper { width: 100%; }
  thead td, tfoot td { padding: 0; }
  tbody td { padding: 20px 35px; }
  .document-title { font-size: 18px; font-weight: 800; text-align: center; margin-bottom: 12px; color: #1a1a2e; }
  .section-title { font-size: 12px; font-weight: 700; margin: 12px 0 6px; color: #1a1a2e; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
  p { margin: 4px 0; }
  ul.document-list { margin: 4px 0 4px 16px; }
  ul.document-list li { margin: 2px 0; }
  .sign-section { margin-top: 24px; display: flex; justify-content: space-between; gap: 30px; }
  .sign-section p { flex: 1; }
</style></head><body>
  <table class="page-wrapper">
    <thead><tr><td>${brandHeaderHtml}</td></tr></thead>
    <tfoot><tr><td>${brandFooterHtml}</td></tr></tfoot>
    <tbody><tr><td>${getFilledHtml()}</td></tr></tbody>
  </table>
</body></html>`;

    const handlePdf = async (share = false) => {
        try {
            const html = getFullHtml();
            if (Platform.OS === 'web') {
                const win = window.open('', '_blank');
                if (!win) { window.alert('Allow pop-ups'); return; }
                win.document.write(html);
                win.document.close();
                setTimeout(() => win.print(), 400);
            } else if (!share) {
                await Print.printAsync({ html });
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Contract' });
                }
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to generate PDF');
        }
    };

    const startEditing = () => {
        setEditText(htmlToPlainText(templateContent));
        setEditing(true);
    };

    const handleSave = async () => {
        const newHtml = plainTextToHtml(editText);
        setTemplateContent(newHtml);
        setEditing(false);
        if (!contract?._id) return;
        setSaving(true);
        try {
            await contractService.update(contract._id, { template: { content: newHtml } });
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    // Auto-save when leaving the screen while in edit mode
    useEffect(() => {
        const unsub = navigation.addListener('beforeRemove', () => {
            if (editing && editText) {
                const newHtml = plainTextToHtml(editText);
                if (contract?._id) {
                    contractService.update(contract._id, { template: { content: newHtml } }).catch(() => { });
                }
            }
        });
        return unsub;
    }, [navigation, editing, editText, contract]);

    if (loading || !contract) return <LoadingScreen />;

    return (
        <View style={styles.container}>
            {/* Toolbar */}
            <View style={styles.toolbar}>
                <TouchableOpacity style={[styles.toolBtn, editing && styles.saveBtn]} onPress={editing ? handleSave : startEditing}>
                    <Icon name={editing ? 'content-save-outline' : 'pencil-outline'} size={20} color={editing ? '#fff' : colors.primary} />
                    <Text style={[styles.toolText, editing && { color: '#fff' }]}>{saving ? 'Saving...' : editing ? 'Save' : 'Edit'}</Text>
                </TouchableOpacity>
                {editing && (
                    <TouchableOpacity style={styles.toolBtn} onPress={() => setEditing(false)}>
                        <Icon name="close" size={20} color={colors.error} />
                        <Text style={styles.toolText}>Cancel</Text>
                    </TouchableOpacity>
                )}
                {!editing && (
                    <>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => handlePdf(false)}>
                            <Icon name="file-pdf-box" size={20} color={colors.error} />
                            <Text style={styles.toolText}>PDF</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => handlePdf(true)}>
                            <Icon name="share-variant-outline" size={20} color={colors.info} />
                            <Text style={styles.toolText}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtn} onPress={() => navigation.navigate('ContractForm', { contract })}>
                            <Icon name="form-select" size={20} color={colors.primary} />
                            <Text style={styles.toolText}>Fields</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {editing ? (
                <ScrollView style={styles.editorScroll} keyboardShouldPersistTaps="handled">
                    <TextInput
                        style={styles.editor}
                        value={editText}
                        onChangeText={setEditText}
                        multiline
                        textAlignVertical="top"
                        autoCorrect={false}
                        placeholder="Edit contract text..."
                        placeholderTextColor={colors.textLight}
                    />
                </ScrollView>
            ) : (
                <ScrollView style={styles.previewScroll}>
                    {/* Render a simplified preview with filled data */}
                    <View style={styles.previewCard}>
                        <Text style={styles.previewTitle}>VEHICLE RENTAL AGREEMENT</Text>

                        <Text style={styles.previewSection}>PARTIES</Text>
                        <Text style={styles.previewText}>1. {BRAND.name} (the "Company")</Text>
                        <Text style={styles.previewText}>2. {contract.companyName || '—'}, Trade License: {contract.tradeLicenseNo || '—'}, represented by {contract.contactPerson || '—'} (the "Client")</Text>

                        <Text style={styles.previewSection}>VEHICLE</Text>
                        <Text style={styles.previewText}>• Plate: {vehicle?.plateNumber || vehicle?.licensePlate || contract.vehicleName || '—'}</Text>
                        <Text style={styles.previewText}>• {vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}` : '—'}</Text>

                        <Text style={styles.previewSection}>CONTRACT TERMS</Text>
                        <Text style={styles.previewText}>• Duration: {fmtDate(contract.startDate)} to {fmtDate(contract.endDate)}</Text>
                        <Text style={styles.previewText}>• Monthly Rate: AED {Number(contract.amount || contract.value || 0).toLocaleString()}</Text>
                        <Text style={styles.previewText}>• Security Deposit: AED {Number(contract.securityDeposit || 1000).toLocaleString()}</Text>
                        <Text style={styles.previewText}>• Type: {contract.contractType || 'Monthly'}</Text>

                        <Text style={styles.previewSection}>CLIENT RESPONSIBILITIES</Text>
                        <Text style={styles.previewText}>• Fuel, Salik, traffic fines, parking violations</Text>
                        <Text style={styles.previewText}>• Routine maintenance</Text>
                        <Text style={styles.previewText}>• Max 5,000 km/month (AED 1/km excess)</Text>

                        <Text style={styles.previewSection}>TERMINATION</Text>
                        <Text style={styles.previewText}>• 30 days written notice required</Text>
                        <Text style={styles.previewText}>• Vehicle must be returned with all dues settled</Text>

                        <View style={styles.signRow}>
                            <View style={styles.signBox}>
                                <Text style={styles.signLabel}>{BRAND.shortName}</Text>
                                <View style={styles.signLine} />
                                <Text style={styles.signHint}>Authorized Signature</Text>
                            </View>
                            <View style={styles.signBox}>
                                <Text style={styles.signLabel}>{contract.companyName || 'Client'}</Text>
                                <View style={styles.signLine} />
                                <Text style={styles.signHint}>Authorized Signature</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    toolbar: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    toolBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
        backgroundColor: colors.background,
    },
    saveBtn: { backgroundColor: colors.primary },
    toolText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
    editorScroll: { flex: 1, padding: spacing.md },
    editor: {
        fontSize: 14, fontFamily: fonts.regular, color: colors.text,
        backgroundColor: '#fff', borderRadius: borderRadius.md,
        padding: spacing.md, minHeight: 500, borderWidth: 1, borderColor: colors.divider,
        lineHeight: 22,
    },
    previewScroll: { flex: 1 },
    previewCard: {
        margin: spacing.md, padding: spacing.lg,
        backgroundColor: '#fff', borderRadius: borderRadius.lg, ...shadows.md,
    },
    previewTitle: { fontSize: 20, fontFamily: fonts.extraBold, color: '#1a1a2e', textAlign: 'center', marginBottom: 20 },
    previewSection: { fontSize: 14, fontFamily: fonts.bold, color: '#1a1a2e', marginTop: 18, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4 },
    previewText: { fontSize: 13, fontFamily: fonts.regular, color: '#444', marginBottom: 4, lineHeight: 20 },
    signRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, gap: 20 },
    signBox: { flex: 1, alignItems: 'center' },
    signLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 30 },
    signLine: { width: '100%', height: 1, backgroundColor: '#333', marginBottom: 6 },
    signHint: { fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary },
});

export default ContractTemplateScreen;
