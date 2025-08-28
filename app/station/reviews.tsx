import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Review } from '../../types';
import { formatDateTime, getRelativeTime } from '../../utils/helpers';

export default function StationReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stationId } = useLocalSearchParams();
  
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [showAddReview, setShowAddReview] = useState(false);

  // Mock reviews data
  const mockReviews: Review[] = [
    {
      id: '1',
      userId: 'user1',
      stationId: stationId as string,
      rating: 5,
      comment: 'Excellent fast charging station! Clean facilities and reliable equipment. The location is perfect for shopping while charging.',
      images: [],
      visitDate: new Date('2024-03-15'),
      createdAt: new Date('2024-03-15'),
      isVerified: true
    },
    {
      id: '2',
      userId: 'user2',
      stationId: stationId as string,
      rating: 4,
      comment: 'Good charging speed and convenient location. The amenities are great. Only downside is it can get busy during peak hours.',
      images: [],
      visitDate: new Date('2024-03-10'),
      createdAt: new Date('2024-03-10'),
      isVerified: true
    },
    {
      id: '3',
      userId: 'user3',
      stationId: stationId as string,
      rating: 5,
      comment: 'Perfect charging station for road trips. Fast charging, clean restrooms, and good food options nearby.',
      images: [],
      visitDate: new Date('2024-03-08'),
      createdAt: new Date('2024-03-08'),
      isVerified: false
    },
    {
      id: '4',
      userId: 'user4',
      stationId: stationId as string,
      rating: 3,
      comment: 'Decent charging station but one of the ports was out of order. Staff was helpful though.',
      images: [],
      visitDate: new Date('2024-03-05'),
      createdAt: new Date('2024-03-05'),
      isVerified: true
    }
  ];

  const reviews = mockReviews;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const handleSubmitReview = () => {
    if (newRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating');
      return;
    }

    if (!newReview.trim()) {
      Alert.alert('Comment Required', 'Please write a comment about your experience');
      return;
    }

    // TODO: Submit review to API
    Alert.alert(
      'Review Submitted',
      'Thank you for your feedback! Your review will help other EV drivers.',
      [
        {
          text: 'OK',
          onPress: () => {
            setNewReview('');
            setNewRating(0);
            setShowAddReview(false);
          }
        }
      ]
    );
  };

  const renderStars = (rating: number, size: number = 16, interactive: boolean = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={interactive ? () => setNewRating(i) : undefined}
          disabled={!interactive}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={size}
            color={i <= rating ? '#FFB800' : '#E0E0E0'}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]; // 1-5 stars
    reviews.forEach(review => {
      distribution[review.rating - 1]++;
    });

    return (
      <View style={styles.distributionContainer}>
        {distribution.reverse().map((count, index) => {
          const starRating = 5 - index;
          const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
          
          return (
            <View key={starRating} style={styles.distributionRow}>
              <Text style={styles.distributionStar}>{starRating}</Text>
              <Ionicons name="star" size={12} color="#FFB800" />
              <View style={styles.distributionBar}>
                <View 
                  style={[
                    styles.distributionFill,
                    { width: `${percentage}%` }
                  ]}
                />
              </View>
              <Text style={styles.distributionCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <TouchableOpacity onPress={() => setShowAddReview(!showAddReview)}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Rating Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.averageRating}>
              <Text style={styles.averageNumber}>{averageRating.toFixed(1)}</Text>
              {renderStars(Math.round(averageRating), 20)}
              <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
            </View>
            
            {renderRatingDistribution()}
          </View>
        </View>

        {/* Add Review Form */}
        {showAddReview && (
          <View style={styles.addReviewCard}>
            <Text style={styles.addReviewTitle}>Write a Review</Text>
            
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Rate your experience:</Text>
              {renderStars(newRating, 24, true)}
            </View>
            
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Share your experience:</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Tell other EV drivers about your experience at this station..."
                value={newReview}
                onChangeText={setNewReview}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.reviewActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddReview(false);
                  setNewReview('');
                  setNewRating(0);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmitReview}
              >
                <Text style={styles.submitButtonText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          <Text style={styles.reviewsTitle}>All Reviews</Text>
          
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {review.userId.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.reviewerDetails}>
                    <View style={styles.reviewerName}>
                      <Text style={styles.nameText}>User {review.userId.slice(-3)}</Text>
                      {review.isVerified && (
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      )}
                    </View>
                    <Text style={styles.reviewDate}>
                      {getRelativeTime(review.createdAt)}
                    </Text>
                  </View>
                </View>
                
                {renderStars(review.rating, 14)}
              </View>
              
              <Text style={styles.reviewComment}>{review.comment}</Text>
              
              <View style={styles.reviewFooter}>
                <Text style={styles.visitDate}>
                  Visited on {formatDateTime(review.visitDate)}
                </Text>
                
                <View style={styles.reviewActions}>
                  <TouchableOpacity style={styles.helpfulButton}>
                    <Ionicons name="thumbs-up-outline" size={16} color="#666" />
                    <Text style={styles.helpfulText}>Helpful</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  averageRating: {
    alignItems: 'center',
  },
  averageNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  distributionContainer: {
    flex: 1,
    marginLeft: 20,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  distributionStar: {
    fontSize: 12,
    color: '#666',
    width: 12,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    backgroundColor: '#FFB800',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 12,
    color: '#666',
    width: 20,
    textAlign: 'right',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  addReviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addReviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  commentSection: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 100,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  reviewsList: {
    marginBottom: 20,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitDate: {
    fontSize: 12,
    color: '#666',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpfulText: {
    fontSize: 12,
    color: '#666',
  },
});
