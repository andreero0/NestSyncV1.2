/**
 * Legal Modals Component
 * PIPEDA-compliant privacy policy, terms of service, and affiliate disclosure modals
 * Designed for Canadian legal compliance and accessibility
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants/Colors';

interface LegalModalProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms' | 'affiliate';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isVisible, onClose, type }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.backgroundSecondary,
      borderBottomColor: colors.border,
    },
    title: {
      color: colors.text,
    },
    closeButton: {
      color: colors.tint,
    },
    content: {
      backgroundColor: colors.background,
    },
    sectionTitle: {
      color: colors.text,
    },
    text: {
      color: colors.text,
    },
    highlight: {
      color: colors.tint,
    },
  };

  const getModalContent = () => {
    switch (type) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          content: (
            <ScrollView style={[styles.content, dynamicStyles.content]}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Data Protection Under PIPEDA
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                NestSync is committed to protecting your privacy in compliance with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA).
              </Text>

              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Information We Collect
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                We collect only the information necessary to provide our diaper tracking service:
                {'\n\n'}• Child's basic information (name, age, diaper preferences)
                {'\n'}• Diaper change tracking data
                {'\n'}• Inventory and purchase history
                {'\n'}• App usage analytics (if consented)
                {'\n'}• Marketing preferences (if consented)
              </Text>

              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                How We Use Your Information
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                Your information is used to:
                {'\n\n'}• Track diaper usage patterns and predict needs
                {'\n'}• Send low inventory alerts and recommendations
                {'\n'}• Improve our service (with your consent)
                {'\n'}• Provide customer support
                {'\n'}• Send marketing communications (only if consented)
              </Text>

              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Your Rights Under PIPEDA
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                You have the right to:
                {'\n\n'}• Access your personal information
                {'\n'}• Request corrections to inaccurate data
                {'\n'}• Withdraw consent at any time
                {'\n'}• Request deletion of your data
                {'\n'}• File complaints with the Privacy Commissioner of Canada
              </Text>

              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Data Storage and Security
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                All data is stored on Canadian servers and is protected with industry-standard encryption. We never sell your personal information to third parties.
              </Text>

              <Text style={[styles.highlight, dynamicStyles.highlight]}>
                🇨🇦 Your data stays in Canada and is protected under PIPEDA.
              </Text>
            </ScrollView>
          ),
        };

      case 'terms':
        return {
          title: 'Terms of Service',
          content: (
            <ScrollView style={[styles.content, dynamicStyles.content]}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Terms of Service
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                By using NestSync, you agree to these terms of service. Please read them carefully.
              </Text>

              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Service Description
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                NestSync is a Canadian diaper planning and tracking application designed to help parents:
                {'\n\n'}• Track diaper usage patterns
                {'\n'}• Manage diaper inventory
                {'\n'}• Receive predictive reorder recommendations
                {'\n'}• Access Canadian pricing and availability information
              </Text>

              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                User Responsibilities
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                You agree to:
                {'\n\n'}• Provide accurate information
                {'\n'}• Use the service lawfully and responsibly
                {'\n'}• Maintain the confidentiality of your account
                {'\n'}• Notify us of any unauthorized access
              </Text>

              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Limitation of Liability
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                NestSync provides recommendations based on data you provide. We are not liable for:
                {'\n\n'}• Diaper shortages or overstocking
                {'\n'}• Price fluctuations from retailers
                {'\n'}• Third-party service interruptions
                {'\n'}• User error in data entry
              </Text>

              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Canadian Governing Law
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                These terms are governed by Canadian law and the laws of the province where you reside.
              </Text>
            </ScrollView>
          ),
        };

      case 'affiliate':
        return {
          title: 'Affiliate Program Disclosure',
          content: (
            <ScrollView style={[styles.content, dynamicStyles.content]}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Affiliate Disclosure
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                NestSync participates in affiliate programs with major Canadian retailers to help support our free service.
              </Text>

              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                How Affiliate Links Work
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                When you click on product recommendations or "Buy Now" links in our app:
                {'\n\n'}• You may be directed to retailer websites through affiliate links
                {'\n'}• We may earn a small commission if you make a purchase
                {'\n'}• {' '}
                <Text style={[styles.highlight, dynamicStyles.highlight]}>
                  This does not increase the price you pay
                </Text>
                {'\n'}• Your purchase helps support NestSync's development
              </Text>

              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Our Partner Retailers
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                We work with trusted Canadian retailers including:
                {'\n\n'}• Amazon Canada
                {'\n'}• Walmart Canada
                {'\n'}• Loblaw (Real Canadian Superstore, No Frills)
                {'\n'}• Well.ca
                {'\n'}• Costco Canada
              </Text>

              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                Our Commitment to You
              </Text>
              <Text style={[styles.text, dynamicStyles.text]}>
                • We only recommend products we believe are good value
                {'\n'}• Our price comparisons remain objective and accurate
                {'\n'}• We prioritize your savings over our commissions
                {'\n'}• You can always shop directly with retailers if you prefer
              </Text>

              <Text style={[styles.highlight, dynamicStyles.highlight]}>
                Transparency is important to us. This disclosure ensures you understand how we operate while keeping NestSync free for Canadian families.
              </Text>
            </ScrollView>
          ),
        };

      default:
        return { title: '', content: null };
    }
  };

  const { title, content } = getModalContent();

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <View style={[styles.header, dynamicStyles.header]}>
          <Text style={[styles.title, dynamicStyles.title]}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButtonContainer}
            accessibilityRole="button"
            accessibilityLabel={`Close ${title} modal`}
          >
            <Text style={[styles.closeButton, dynamicStyles.closeButton]}>Done</Text>
          </TouchableOpacity>
        </View>
        {content}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButtonContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 22,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  highlight: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    paddingVertical: 12,
  },
});

export default LegalModal;