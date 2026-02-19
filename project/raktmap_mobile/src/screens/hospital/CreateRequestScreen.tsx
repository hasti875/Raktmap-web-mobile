import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../../config/api';

const CreateRequestScreen = () => {
  const [formData, setFormData] = useState({
    bloodGroup: '',
    quantity: '1',
    urgency: 'medium',
    patientAge: '',
    patientCondition: '',
    requiredBy: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const onChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    const currentDate = selectedDate || date;
    setDate(currentDate);

    if (Platform.OS === 'android') {
      setShowPicker(false);
      // If we just selected a date, now select the time
      if (mode === 'date') {
        setMode('time');
        // Small timeout to allow the date picker to fully close
        setTimeout(() => setShowPicker(true), 100);
      } else {
        // Time selected, update form data
        setMode('date'); // Reset for next time
        const formatted = currentDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
        setFormData({ ...formData, requiredBy: formatted });
      }
    } else {
      // iOS handling (if needed, usually inline or modal)
      const formatted = currentDate.toISOString().slice(0, 16);
      setFormData({ ...formData, requiredBy: formatted });
    }
  };

  const showDatepicker = () => {
    setMode('date');
    setShowPicker(true);
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: '#10B981', icon: '🩺' },
    { value: 'medium', label: 'Medium Priority', color: '#F59E0B', icon: '⏰' },
    { value: 'high', label: 'High Priority - Emergency', color: '#EF4444', icon: '🚨' },
    { value: 'pregnancy', label: 'Pregnancy', color: '#EC4899', icon: '🤰' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!formData.bloodGroup) {
      Alert.alert('Error', 'Please select a blood group');
      return;
    }
    if (!formData.requiredBy) {
      Alert.alert('Error', 'Please enter required by date');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/blood-requests', {
        bloodGroup: formData.bloodGroup,
        quantity: parseInt(formData.quantity) || 1,
        urgency: formData.urgency,
        requiredBy: formData.requiredBy,
        description: formData.description,
        patientAge: formData.patientAge ? parseInt(formData.patientAge) : undefined,
        patientCondition: formData.patientCondition,
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Blood request created successfully! Notifications will be sent to matching donors.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  bloodGroup: '',
                  quantity: '1',
                  urgency: 'medium',
                  patientAge: '',
                  patientCondition: '',
                  requiredBy: '',
                  description: '',
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error creating blood request:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create blood request'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Fill in the details to create a blood request. Matching donors will be
            notified automatically via SMS and app notifications.
          </Text>
        </View>

        {/* Blood Group */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Blood Group <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.bloodGroup}
              onValueChange={(value) =>
                setFormData({ ...formData, bloodGroup: value })
              }
            >
              <Picker.Item label="Select Blood Group" value="" />
              {bloodGroups.map((group) => (
                <Picker.Item key={group} label={group} value={group} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Units Required */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Quantity (Units) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.quantity}
            onChangeText={(text) =>
              setFormData({ ...formData, quantity: text })
            }
            keyboardType="number-pad"
            placeholder="1"
          />
          <Text style={styles.helperText}>Min: 1, Max: 10</Text>
        </View>

        {/* Required By */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Required By (Date & Time) <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={showDatepicker}
          >
            <Text style={formData.requiredBy ? styles.dateText : styles.placeholderText}>
              {formData.requiredBy
                ? new Date(formData.requiredBy).toLocaleString([], {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : 'Select Date & Time'}
            </Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={mode}
              is24Hour={true}
              onChange={onChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Patient Age */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Patient Age (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.patientAge}
            onChangeText={(text) =>
              setFormData({ ...formData, patientAge: text })
            }
            keyboardType="number-pad"
            placeholder="Enter patient age"
          />
        </View>

        {/* Urgency */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Urgency Level <Text style={styles.required}>*</Text>
          </Text>
          {urgencyLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.urgencyCard,
                formData.urgency === level.value && styles.urgencyCardActive,
                { borderColor: formData.urgency === level.value ? level.color : '#E5E7EB' },
              ]}
              onPress={() => setFormData({ ...formData, urgency: level.value })}
            >
              <Text style={styles.urgencyIcon}>{level.icon}</Text>
              <Text
                style={[
                  styles.urgencyLabel,
                  formData.urgency === level.value && { color: level.color },
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Patient Condition */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Patient Condition (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.patientCondition}
            onChangeText={(text) =>
              setFormData({ ...formData, patientCondition: text })
            }
            placeholder="e.g., Surgery, Accident, Cancer treatment"
          />
        </View>

        {/* Additional Notes */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            placeholder="Any specific requirements or additional information..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* What Happens Next */}
        <View style={styles.infoBox2}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.bulletPoint}>• SMS notifications will be sent to eligible donors in your area</Text>
          <Text style={styles.bulletPoint}>• You'll receive real-time updates as donors respond</Text>
          <Text style={styles.bulletPoint}>• Donor contact information will be shared once they confirm</Text>
          <Text style={styles.bulletPoint}>• You can track the progress in the Live Map section</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating Request...' : 'Create Blood Request'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  urgencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  urgencyCardActive: {
    backgroundColor: '#F9FAFB',
  },
  urgencyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  urgencyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  infoBox2: {
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 13,
    color: '#1E40AF',
    marginBottom: 6,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  calendarIcon: {
    fontSize: 18,
  },
});

export default CreateRequestScreen;
