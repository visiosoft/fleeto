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
<div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #14081F; font-size: 15px; line-height: 1.6;">

  <div style="display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid #14081F; padding-bottom: 18px; margin-bottom: 28px;">
    <div>
      <div style="text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; font-size: 11px; color: #4A1FA0; margin-bottom: 8px;">Vehicle Rental Agreement</div>
      <h1 style="font-family: 'Bricolage Grotesque', serif; font-weight: 800; font-size: 34px; letter-spacing: -0.02em; margin: 0; color: #1A0B33;">Rental Agreement</h1>
    </div>
    <div style="text-align: right; font-size: 12px; color: #756E80; font-weight: 500;">
      <div>Dubai, United Arab Emirates</div>
      <div>Entered into [Start Date]</div>
    </div>
  </div>

  <p style="margin: 0 0 26px; color: #4A4357;">This Vehicle Rental Agreement (the &ldquo;Agreement&rdquo;) is made and entered into on <strong style="color: #14081F;">[Start Date]</strong> in Dubai, United Arab Emirates.</p>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px;">
    <div style="border: 1px solid rgba(20,8,31,.14); border-radius: 12px; padding: 18px 20px;">
      <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; font-weight: 700; color: #756E80; margin-bottom: 8px;">Company</div>
      <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">${BRAND.name}</div>
      <div style="color: #4A4357; font-size: 13.5px;">Registered under the laws of UAE<br>Registered office: Dubai, UAE</div>
    </div>
    <div style="border: 1px solid rgba(20,8,31,.14); border-radius: 12px; padding: 18px 20px;">
      <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; font-weight: 700; color: #756E80; margin-bottom: 8px;">Client</div>
      <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">[Client Company Name]</div>
      <div style="color: #4A4357; font-size: 13.5px;">Registered under the laws of UAE &middot; Trade License No. [Client Trade License No]<br>Represented by [Contact Person]</div>
    </div>
  </div>

  <div style="border: 1px solid #DDD0FF; background: #F7F3FF; border-radius: 12px; padding: 22px 24px; margin-bottom: 30px;">
    <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; font-weight: 700; color: #4A1FA0; margin-bottom: 14px;">Key Terms at a Glance</div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px 24px;">
      <div>
        <div style="font-size: 11px; color: #756E80; margin-bottom: 3px;">Vehicle</div>
        <div style="font-weight: 700; font-size: 14px;">[Vehicle Make] [Vehicle Model] [Vehicle Year]</div>
        <div style="font-size: 12px; color: #4A4357;">Plate [Vehicle License Plate]</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #756E80; margin-bottom: 3px;">Duration</div>
        <div style="font-weight: 700; font-size: 14px;">[Start Date] &ndash; [End Date]</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #756E80; margin-bottom: 3px;">Total Rental Value</div>
        <div style="font-weight: 700; font-size: 14px;">AED [Value]</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #756E80; margin-bottom: 3px;">Security Deposit</div>
        <div style="font-weight: 700; font-size: 14px;">AED [Security Deposit]</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #756E80; margin-bottom: 3px;">Payment Method</div>
        <div style="font-weight: 700; font-size: 14px;">[Payment Method]</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #756E80; margin-bottom: 3px;">Mileage Cap</div>
        <div style="font-weight: 700; font-size: 14px;">[Mileage Cap] km / month</div>
      </div>
    </div>
  </div>

  <h2 style="font-family: 'Bricolage Grotesque', serif; font-weight: 700; font-size: 20px; letter-spacing: -0.01em; color: #1A0B33; margin: 0 0 12px;">Vehicle Information</h2>
  <p style="margin: 0 0 8px; color: #4A4357;">The Company hereby rents to the Client the following vehicle without driver:</p>
  <div style="margin: 0 0 30px 24px; color: #14081F;">
    <div style="margin-bottom: 4px;">License Plate: <strong>[Vehicle License Plate]</strong></div>
    <div>Make / Model / Year: <strong>[Vehicle Make] [Vehicle Model] [Vehicle Year]</strong></div>
  </div>

  <h2 style="font-family: 'Bricolage Grotesque', serif; font-weight: 700; font-size: 20px; letter-spacing: -0.01em; color: #1A0B33; margin: 0 0 16px;">Terms and Conditions</h2>

  <h3 style="font-size: 14.5px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 10px;">Contract Duration and Value</h3>
  <div style="margin: 0 0 12px 24px;">
    <div style="margin-bottom: 4px;">Duration: From [Start Date] to [End Date]</div>
    <div style="margin-bottom: 4px;">Renewal: Only upon mutual written consent of both Parties</div>
    <div style="margin-bottom: 4px;">Total Rental Value: AED [Value]</div>
    <div style="margin-bottom: 4px;">Security Deposit: AED [Security Deposit]</div>
    <div>Payment Method: Post-Dated Cheque (PDC) for full rental amount</div>
  </div>
  <p style="margin: 0 0 22px; color: #4A4357;">The Security Deposit shall be refundable within 21 days after vehicle return, subject to inspection, clearance of fines, Salik charges, and settlement of all outstanding dues. The Company reserves the right to deduct unpaid amounts, damages, fines, repair costs, or other liabilities from the deposit.</p>

  <h3 style="font-size: 14.5px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 10px;">Vehicle Handover and Condition</h3>
  <p style="margin: 0 0 22px; color: #4A4357;">The Vehicle shall be delivered in good working and roadworthy condition. A vehicle handover report shall be signed by both Parties at delivery and return. The Client confirms receipt of the Vehicle in satisfactory condition.</p>

  <h3 style="font-size: 14.5px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 10px;">Payment Default</h3>
  <p style="margin: 0 0 22px; color: #4A4357;">In case of cheque dishonor or delayed payment, the Company reserves the right to immediately repossess the Vehicle without prior notice and pursue legal remedies under UAE law.</p>

  <h3 style="font-size: 14.5px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 10px;">Client Responsibilities</h3>
  <ul style="margin: 0 0 12px; padding-left: 22px; color: #4A4357;">
    <li>Fuel and petrol costs</li>
    <li>Salik (toll) charges</li>
    <li>Traffic fines, black points, parking violations, and impound charges. It must be paid within 3 days of fines violation.</li>
    <li>Compliance with all UAE traffic laws and regulations</li>
  </ul>
  <p style="margin: 0 0 22px; color: #4A4357;">The Client shall ensure that only legally licensed drivers operate the Vehicle.</p>

  <h3 style="font-size: 14.5px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 10px;">Maintenance and Repairs</h3>
  <div style="margin: 0 0 22px; color: #4A4357;">
    <p style="margin: 0 0 10px;"><strong style="color: #14081F;">Routine Maintenance:</strong> The Client shall be responsible for all routine and preventive maintenance.</p>
    <p style="margin: 0 0 10px;"><strong style="color: #14081F;">Major Repairs:</strong> The Company shall be responsible only for major mechanical defects from normal wear and tear.</p>
    <p style="margin: 0 0 10px;"><strong style="color: #14081F;">Accidents:</strong> Valid Dubai Police report mandatory. Insurance deductible borne by Client.</p>
    <p style="margin: 0 0 10px;"><strong style="color: #14081F;">Authorization:</strong> No non-routine repair without prior written approval from the Company.</p>
    <p style="margin: 0;"><strong style="color: #14081F;">Records:</strong> The Client shall maintain proper maintenance records and provide them upon request.</p>
  </div>

  <div style="border: 1.5px solid #B45309; background: #FEF6E7; border-radius: 12px; padding: 20px 22px; margin: 0 0 26px;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
      <span style="width: 8px; height: 8px; border-radius: 999px; background: #B45309; display: inline-block;"></span>
      <span style="text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 700; color: #92400E;">Important &mdash; Mileage Limit and Excess Charges</span>
    </div>
    <p style="margin: 0; color: #78350F; font-weight: 500;">Maximum [Mileage Cap] km per month. Excess charged at AED [Excess Mileage Rate] per additional km. Odometer recorded monthly and excess invoiced separately, payable within 7 days.</p>
  </div>

  <h3 style="font-size: 14.5px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 10px;">Prohibited Use</h3>
  <p style="margin: 0 0 22px; color: #4A4357;">No illegal activities, racing, sub-renting, or transport outside Dubai without written consent.</p>

  <h3 style="font-size: 14.5px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 10px;">Termination</h3>
  <ul style="margin: 0 0 22px; padding-left: 22px; color: #4A4357;">
    <li>Early termination requires 30 days written notice and full settlement.</li>
    <li>Upon termination, Vehicle must be returned immediately and all dues settled.</li>
  </ul>

  <h3 style="font-size: 14.5px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 10px;">Governing Law</h3>
  <p style="margin: 0 0 36px; color: #4A4357;">Governed by UAE laws. Courts of Dubai have exclusive jurisdiction.</p>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 28px;">
    <div>
      <div style="font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #1A0B33; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(20,8,31,.14);">For ${BRAND.name}</div>
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13.5px; color: #4A4357;">
        <div>Name: <span style="display: inline-block; border-bottom: 1px dotted #756E80; width: 58%;">&nbsp;</span></div>
        <div>Signature: <span style="display: inline-block; border-bottom: 1px dotted #756E80; width: 58%;">&nbsp;</span></div>
        <div>Date: <span style="display: inline-block; border-bottom: 1px dotted #756E80; width: 62%;">&nbsp;</span></div>
      </div>
    </div>
    <div>
      <div style="font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #1A0B33; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(20,8,31,.14);">For [Client Company Name]</div>
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13.5px; color: #4A4357;">
        <div>Name: <strong style="color: #14081F;">[Contact Person]</strong></div>
        <div>Signature: <span style="display: inline-block; border-bottom: 1px dotted #756E80; width: 58%;">&nbsp;</span></div>
        <div>Date: <span style="display: inline-block; border-bottom: 1px dotted #756E80; width: 62%;">&nbsp;</span></div>
      </div>
    </div>
  </div>

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
            .replace(/\[Payment Method\]/g, contract.paymentMethod || 'Post-Dated Cheque')
            .replace(/\[Mileage Cap\]/g, Number(contract.mileageCap || 5000).toLocaleString())
            .replace(/\[Excess Mileage Rate\]/g, String(contract.excessMileageRate || 1))
            .replace(/\[Vehicle License Plate\]/g, vehicle?.plateNumber || vehicle?.licensePlate || contract.vehicleName || '')
            .replace(/\[Vehicle Make\]/g, vehicle?.make || '')
            .replace(/\[Vehicle Model\]/g, vehicle?.model || '')
            .replace(/\[Vehicle Year\]/g, vehicle?.year?.toString() || '');
        return html;
    };

    const getFullHtml = () => `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { margin: 0; background: #FBF8F2; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #14081F; font-size: 11px; line-height: 1.4; }
  ${brandCss}
  table.page-wrapper { width: 100%; }
  thead td, tfoot td { padding: 0; }
  tbody td { padding: 20px 35px; }
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
