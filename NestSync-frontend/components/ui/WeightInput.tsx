/**
 * Smart Weight Input Component
 * Intelligent weight input with metric/imperial toggle and real-time conversion
 * Designed for Canadian parents with psychology-driven UX
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useWeightUnit } from '../../contexts/UnitPreferenceContext';
import { NestSyncInput } from './NestSyncInput';
import { IconSymbol } from './IconSymbol';
import { UnitSegmentedControl } from './UnitSegmentedControl';
import {
  WeightUnit,
  parseWeightInput,
  getAlternateUnitDisplay,
  gramsToPoundsOunces,
  gramsToKilograms,
  poundsOuncesToGrams,
  validateNewbornWeight,
} from '../../lib/utils/weightConversion';

export interface WeightInputProps {
  label?: string;
  value?: number; // weight in grams
  onValueChange: (grams: number) => void;
  required?: boolean;
  containerStyle?: ViewStyle;
  placeholder?: string;
  helpText?: string;
  showUnitToggle?: boolean;
  validateRange?: boolean;
  allowEmpty?: boolean;
}

export function WeightInput({
  label = "Weight",
  value,
  onValueChange,
  required = false,
  containerStyle,
  placeholder,
  helpText,
  showUnitToggle = true,
  validateRange = true,
  allowEmpty = true,
}: WeightInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { weightUnit, updateWeightUnit, isCanadian } = useWeightUnit();

  // Local state for input handling
  const [localUnit, setLocalUnit] = useState<WeightUnit>(weightUnit);
  const [inputValues, setInputValues] = useState({
    pounds: '',
    ounces: '',
    metric: '', // Can be kg or g
  });
  const [error, setError] = useState<string | undefined>();
  const [showConversion, setShowConversion] = useState(false);

  // Sync with global unit preference
  useEffect(() => {
    setLocalUnit(weightUnit);
  }, [weightUnit]);

  const updateInputsFromGrams = useCallback((grams: number) => {
    if (localUnit === 'imperial') {
      const { pounds, ounces } = gramsToPoundsOunces(grams);
      setInputValues({
        pounds: pounds.toString(),
        ounces: ounces > 0 ? ounces.toString() : '',
        metric: '',
      });
    } else {
      const kg = gramsToKilograms(grams);
      const displayValue = kg >= 1 ? kg.toString() : grams.toString();
      setInputValues({
        pounds: '',
        ounces: '',
        metric: displayValue,
      });
    }
  }, [localUnit]);

  // Initialize input values when value prop changes
  useEffect(() => {
    if (value && value > 0) {
      updateInputsFromGrams(value);
      setShowConversion(true);
    } else {
      clearInputs();
      setShowConversion(false);
    }
  }, [value, localUnit, updateInputsFromGrams]);

  const clearInputs = () => {
    setInputValues({
      pounds: '',
      ounces: '',
      metric: '',
    });
  };

  const handleUnitToggle = async (newUnit?: WeightUnit) => {
    const targetUnit = newUnit || (localUnit === 'metric' ? 'imperial' : 'metric');
    setLocalUnit(targetUnit);
    
    // Update global preference
    await updateWeightUnit(targetUnit);
    
    // Convert current value to new unit
    if (value && value > 0) {
      updateInputsFromGrams(value);
    }
    
    // Clear any errors when switching units
    setError(undefined);
  };

  const validateAndUpdateValue = (grams: number) => {
    setError(undefined);
    
    if (validateRange && grams > 0) {
      const validation = validateNewbornWeight(grams);
      if (!validation.isValid) {
        setError(validation.message);
        // Still update the value, but show warning
        onValueChange(grams);
        return;
      }
    }
    
    onValueChange(grams);
    setShowConversion(grams > 0);
  };

  const handleMetricChange = (text: string) => {
    setInputValues(prev => ({ ...prev, metric: text }));
    
    if (!text.trim()) {
      if (allowEmpty) {
        onValueChange(0);
        setShowConversion(false);
        setError(undefined);
      }
      return;
    }
    
    const parsed = parseWeightInput(text, 'metric');
    if (parsed.isValid) {
      validateAndUpdateValue(parsed.grams);
    } else {
      setError(parsed.error);
      // Don't update the value for invalid input
    }
  };

  const handleImperialChange = (field: 'pounds' | 'ounces', text: string) => {
    const newInputs = { ...inputValues, [field]: text };
    setInputValues(newInputs);
    
    const pounds = parseFloat(newInputs.pounds) || 0;
    const ounces = parseFloat(newInputs.ounces) || 0;
    
    if (pounds === 0 && ounces === 0) {
      if (allowEmpty) {
        onValueChange(0);
        setShowConversion(false);
        setError(undefined);
      }
      return;
    }
    
    if (pounds < 0 || ounces < 0) {
      setError('Weight cannot be negative');
      return;
    }
    
    if (ounces >= 16) {
      setError('Ounces must be less than 16');
      return;
    }
    
    const grams = poundsOuncesToGrams(pounds, ounces);
    validateAndUpdateValue(grams);
  };

  const getConversionDisplay = () => {
    if (!value || value === 0) return '';
    return getAlternateUnitDisplay(value, localUnit);
  };

  const getUnitToggleIcon = () => {
    return localUnit === 'metric' ? 'scalemass.fill' : 'ruler.fill';
  };

  const getPlaceholderText = () => {
    if (placeholder) return placeholder;
    if (localUnit === 'metric') {
      return '3.2';
    } else {
      return '7.1';
    }
  };

  const getHelpTextWithCanadianContext = () => {
    let baseHelpText = helpText;
    
    if (isCanadian && !helpText) {
      baseHelpText = localUnit === 'metric' 
        ? 'Enter weight in kg (e.g., 3.2) or grams (e.g., 3200)'
        : 'Enter weight in pounds (decimals allowed, e.g., 7.2)';
    }
    
    return baseHelpText;
  };

  const renderMetricInput = () => (
    <NestSyncInput
      value={inputValues.metric}
      onChangeText={handleMetricChange}
      placeholder={getPlaceholderText()}
      keyboardType="decimal-pad"
      error={error}
      helpText={getHelpTextWithCanadianContext()}
    />
  );

  const renderImperialInput = () => (
    <View style={styles.imperialContainer}>
      <View style={styles.imperialInputs}>
        <View style={styles.poundsContainer}>
          <NestSyncInput
            label="Pounds"
            value={inputValues.pounds}
            onChangeText={(text) => handleImperialChange('pounds', text)}
            placeholder="7"
            keyboardType="decimal-pad"
            containerStyle={styles.imperialInput}
          />
        </View>
        
        <View style={styles.ouncesContainer}>
          <NestSyncInput
            label="Ounces (optional)"
            value={inputValues.ounces}
            onChangeText={(text) => handleImperialChange('ounces', text)}
            placeholder="3"
            keyboardType="decimal-pad"
            containerStyle={styles.imperialInput}
          />
        </View>
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
      
      {getHelpTextWithCanadianContext() && !error && (
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>
          {getHelpTextWithCanadianContext()}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.textEmphasis }]}>
            {label}
            {required && (
              <Text style={[styles.required, { color: colors.error }]}> *</Text>
            )}
          </Text>
        </View>
      )}

      {showUnitToggle && (
        <UnitSegmentedControl
          selectedUnit={localUnit}
          onUnitChange={handleUnitToggle}
        />
      )}

      {localUnit === 'metric' ? renderMetricInput() : renderImperialInput()}

      {showConversion && value && value > 0 && (
        <View style={[styles.conversionContainer, { backgroundColor: colors.surface }]}>
          <IconSymbol name="arrow.2.squarepath" size={16} color={colors.textSecondary} />
          <Text style={[styles.conversionText, { color: colors.textSecondary }]}>
            = {getConversionDisplay()}
          </Text>
        </View>
      )}

      {isCanadian && !error && showConversion && (
        <View style={styles.canadianContext}>
          <Text style={[styles.canadianHint, { color: colors.textSecondary }]}>
            Both units commonly used in Canada
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  
  labelContainer: {
    marginBottom: 6,
  },
  
  label: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  
  required: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  
  imperialContainer: {
    gap: 12,
  },
  
  imperialInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  
  poundsContainer: {
    flex: 2,
  },
  
  ouncesContainer: {
    flex: 1,
  },
  
  imperialInput: {
    marginBottom: 0,
  },
  
  
  conversionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  
  conversionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  canadianContext: {
    marginTop: 4,
  },
  
  canadianHint: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    fontWeight: '500',
  },
  
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
});

export default WeightInput;