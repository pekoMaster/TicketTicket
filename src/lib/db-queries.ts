import { supabaseAdmin } from './supabase';
import { Listing, TicketRequest, User } from '@/types';

/**
 * 獲取公開刊登列表 (安全白名單)
 */
export async function getPublicListings(page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabaseAdmin
    .from('listings')
    .select(`
      id, host_id, event_id, event_name, artist_tags, event_date, venue, meeting_time, meeting_location, 
      total_slots, available_slots, ticket_type, seat_grade, ticket_count_type, status, description, 
      host_nationality, host_languages, will_assist_entry, created_at, updated_at,
      original_price_jpy, asking_price_jpy, ticket_source, identification_features,
      exchange_event_name, exchange_seat_grade, exchange_seat_grades,
      host:users!host_id(id, username, avatar_url, custom_avatar_url, rating, review_count)
    `, { count: 'exact' })
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('[db-queries] Error fetching listings:', error);
    return { data: [], pagination: { total: 0, totalPages: 0 } };
  }

  return {
    data: (data || []).map(item => {
      const host = Array.isArray(item.host) ? item.host[0] : item.host;
      return {
        ...item,
        hostId: item.host_id,
        eventId: item.event_id,
        eventName: item.event_name,
        artistTags: item.artist_tags,
        eventDate: item.event_date ? new Date(item.event_date) : null,
        meetingTime: item.meeting_time ? new Date(item.meeting_time) : null,
        meetingLocation: item.meeting_location,
        totalSlots: item.total_slots,
        availableSlots: item.available_slots,
        originalPriceJpy: item.original_price_jpy || 0,
        askingPriceJpy: item.asking_price_jpy || 0,
        ticketType: item.ticket_type,
        ticketSource: item.ticket_source,
        seatGrade: item.seat_grade,
        ticketCountType: item.ticket_count_type,
        hostNationality: item.host_nationality,
        hostLanguages: item.host_languages,
        identificationFeatures: item.identification_features,
        willAssistEntry: item.will_assist_entry,
        exchangeEventName: item.exchange_event_name,
        exchangeSeatGrade: item.exchange_seat_grade,
        exchangeSeatGrades: item.exchange_seat_grades,
        createdAt: item.created_at ? new Date(item.created_at) : new Date(),
        updatedAt: item.updated_at ? new Date(item.updated_at) : (item.created_at ? new Date(item.created_at) : new Date()),
        host: host ? {
          ...host,
          avatarUrl: host.avatar_url,
          customAvatarUrl: host.custom_avatar_url,
          reviewCount: host.review_count,
        } : undefined
      };
    }) as unknown as Listing[],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
    },
  };
}

/**
 * 獲取公開求票列表 (安全白名單)
 */
export async function getPublicRequests(status = 'open') {
  const { data, error } = await supabaseAdmin
    .from('ticket_requests')
    .select(`
      id, user_id, event_id, event_name, accepted_types, seat_grades, quantity, description, 
      ticket_source, status, created_at, updated_at, requester_nationality, requester_languages,
      user:users!ticket_requests_user_id_fkey(id, username, avatar_url, custom_avatar_url, rating, review_count)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[db-queries] Error fetching requests:', error);
    return { requests: [] };
  }

  return {
    requests: (data || []).map(item => {
      const user = Array.isArray(item.user) ? item.user[0] : item.user;
      return {
        ...item,
        userId: item.user_id,
        eventId: item.event_id,
        eventName: item.event_name,
        acceptedTypes: item.accepted_types,
        seatGrades: item.seat_grades,
        quantity: item.quantity,
        ticketSource: item.ticket_source,
        requesterNationality: item.requester_nationality,
        requesterLanguages: item.requester_languages,
        createdAt: item.created_at ? new Date(item.created_at) : new Date(),
        updatedAt: item.updated_at ? new Date(item.updated_at) : (item.created_at ? new Date(item.created_at) : new Date()),
        user: user ? {
          ...user,
          avatarUrl: user.avatar_url,
          customAvatarUrl: user.custom_avatar_url,
          reviewCount: user.review_count,
        } : undefined
      };
    }) as unknown as TicketRequest[]
  };
}
