import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSellerRequest {
  eventId: string;
  // Personal details
  firstName: string;
  lastName: string;
  socialId: string;
  socialIdDate: string; // DD/MM/YYYY
  birthdate: string; // DD/MM/YYYY
  gender: number; // 0=male, 1=female
  email: string;
  phone: string;
  // Bank details
  bankCode: number;
  bankBranch: number;
  bankAccountNumber: string;
  // Business details
  incType: number; // 1=עוסק פטור, 2=עוסק מורשה, 3=חברה בע"מ
  incCode?: string; // ח.פ / עוסק מורשה
  merchantName: string;
  merchantNameEn?: string;
  description?: string;
  siteUrl?: string;
  // Address
  city: string;
  street: string;
  streetNumber: string;
  // Contact (can be same as personal)
  contactEmail?: string;
  contactPhone?: string;
}

// Israeli bank codes
const BANK_CODES: Record<number, string> = {
  4: 'בנק יהב',
  9: 'בנק הדואר',
  10: 'בנק לאומי',
  11: 'בנק דיסקונט',
  12: 'בנק הפועלים',
  13: 'בנק אגוד',
  14: 'בנק אוצר החייל',
  17: 'בנק מרכנתיל דיסקונט',
  20: 'בנק מזרחי טפחות',
  31: 'בנק הבינלאומי',
  46: 'בנק מסד',
  52: 'בנק פועלי אגודת ישראל',
  54: 'בנק ירושלים',
};

// Hebrew to English transliteration map
const hebrewToEnglish: Record<string, string> = {
  'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
  'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm',
  'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'f',
  'צ': 'tz', 'ץ': 'tz', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
};

function transliterateHebrew(text: string): string {
  return text.split('').map(char => {
    if (hebrewToEnglish[char]) return hebrewToEnglish[char];
    if (/[a-zA-Z0-9\s\-_]/.test(char)) return char;
    if (char === ' ') return ' ';
    return '';
  }).join('').replace(/\s+/g, ' ').trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const paymeClientKey = Deno.env.get('PAYME_CLIENT_KEY');

    if (!paymeClientKey) {
      throw new Error('PayMe credentials not configured');
    }

    // Get auth header for user validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create client with user token
    const userSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from token
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    // Log only essential fields - avoid serializing base64 file contents
    console.log('Received request for event:', body.eventId, 'merchant:', body.merchantName, 'hasSocialIdFile:', !!body.socialIdFile?.base64, 'hasBankFile:', !!body.bankApprovalFile?.base64);

    // Handle coupon code - bypass PayMe for testing
    if (body.couponCode === 'GIFTKAL-TEST') {
      const { eventId } = body;
      if (!eventId) {
        return new Response(
          JSON.stringify({ error: 'Missing eventId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user owns the event
      const { data: evt } = await supabase
        .from('events')
        .select('id, owner_id, seller_payme_id')
        .eq('id', eventId)
        .single();

      if (!evt || evt.owner_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Event not found or unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (evt.seller_payme_id) {
        return new Response(
          JSON.stringify({ error: 'Seller already exists', sellerId: evt.seller_payme_id }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Set test seller ID
      const testSellerId = `TEST-${crypto.randomUUID().slice(0, 8)}`;
      const testHfKey = `TEST-HF-${crypto.randomUUID().slice(0, 8)}`;
      
      await supabase.from('events').update({
        seller_payme_id: testSellerId,
        hf_api_key: testHfKey,
      }).eq('id', eventId);

      console.log(`Coupon GIFTKAL-TEST applied for event ${eventId}, test seller: ${testSellerId}`);

      return new Response(
        JSON.stringify({
          success: true,
          sellerPaymeId: testSellerId,
          hfApiKey: testHfKey,
          message: 'Test seller created via coupon',
          testMode: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    const requiredFields = [
      'eventId', 'firstName', 'lastName', 'socialId', 'birthdate', 
      'email', 'phone', 'bankCode', 'bankBranch', 'bankAccountNumber',
      'incType', 'merchantName', 'merchantNameEn', 'city', 'street', 'streetNumber'
    ];

    for (const field of requiredFields) {
      const value = body[field as keyof CreateSellerRequest];
      if (value === undefined || value === null || value === '') {
        console.log(`Missing field: ${field}, value:`, value);
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify user owns the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, owner_id, seller_payme_id')
      .eq('id', body.eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = Boolean(adminRole);

    if (event.owner_id !== user.id && !isAdmin) {
      console.log(`Unauthorized seller creation attempt. user=${user.id}, eventOwner=${event.owner_id}, event=${body.eventId}`);
      return new Response(
        JSON.stringify({ error: 'אין הרשאה לאשר חשבון סליקה לאירוע הזה' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (event.seller_payme_id) {
      return new Response(
        JSON.stringify({ error: 'Seller already exists for this event', sellerId: event.seller_payme_id }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Israeli ID (basic check)
    if (!/^\d{9}$/.test(body.socialId)) {
      return new Response(
        JSON.stringify({ error: 'תעודת זהות חייבת להכיל 9 ספרות' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone
    const cleanPhone = body.phone.replace(/[^0-9+]/g, '');
    if (!/^(\+972|0)\d{9}$/.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: 'מספר טלפון לא תקין' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone for PayMe
    const formattedPhone = cleanPhone.startsWith('0') 
      ? '+972' + cleanPhone.slice(1) 
      : cleanPhone;

    // PayMe production base URL from official docs
    const paymeBaseUrl = 'https://live.payme.io';

    // Create seller payload
    const sellerPayload = {
      payme_client_key: paymeClientKey,
      seller_first_name: body.firstName.trim(),
      seller_last_name: body.lastName.trim(),
      seller_social_id: body.socialId,
      seller_social_id_date: body.socialIdDate || '',
      seller_social_id_issued: body.socialIdDate || '',

      seller_birthdate: body.birthdate,
      seller_gender: body.gender || 0,
      seller_email: body.email.trim().toLowerCase(),
      seller_phone: formattedPhone,
      seller_contact_email: (body.contactEmail || body.email).trim().toLowerCase(),
      seller_contact_phone: body.contactPhone ? 
        (body.contactPhone.startsWith('0') ? '+972' + body.contactPhone.slice(1) : body.contactPhone) : 
        formattedPhone,
      seller_bank_code: body.bankCode,
      seller_bank_branch: body.bankBranch,
      seller_bank_account_number: body.bankAccountNumber,
      seller_inc: body.incType,
      seller_inc_code: body.incCode || '',
      seller_merchant_name: body.merchantName.trim(),
      seller_merchant_name_en: body.merchantNameEn || transliterateHebrew(body.merchantName.trim()),
      seller_dba: body.merchantName.trim(),
      seller_dba_en: body.merchantNameEn || transliterateHebrew(body.merchantName.trim()),
      seller_site_url: body.siteUrl || 'https://giftkal.com',
      seller_description: body.description || `אירוע - ${body.merchantName}`,
      seller_address_city: body.city.trim(),
      seller_address_street: body.street.trim(),
      seller_address_street_number: body.streetNumber.trim(),
      seller_address_country: 'IL',
      seller_retail_type: 1, // Online
      seller_person_business_type: 10010, // Events
      market_fee: '1.40', // Platform fee percentage
      language: 'he',
    };

    console.log('Creating seller with PayMe:', paymeBaseUrl);
    console.log('Seller payload:', JSON.stringify(sellerPayload));

    const paymeResponse = await fetch(`${paymeBaseUrl}/api/create-seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sellerPayload),
    });

    const paymeResult = await paymeResponse.json();
    console.log('PayMe create-seller response:', JSON.stringify(paymeResult));
    console.log('PayMe create-seller TOP-LEVEL KEYS:', Object.keys(paymeResult).join(', '));

    if (paymeResult.status_code !== 0) {
      return new Response(
        JSON.stringify({ 
          error: 'PayMe error', 
          details: paymeResult.status_error_details || paymeResult.status_error_code || paymeResult.status_message,
          code: paymeResult.status_code
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update event with seller ID and HF API key (uuid from response).
    // PayMe might return the front-end public key under various names — try all of them.
    // PayMe may return uuid as either a string OR an object: {uuid, description, is_active}
    const extractUuid = (val: unknown): string | null => {
      if (!val) return null;
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val !== null && 'uuid' in val) {
        const inner = (val as { uuid: unknown }).uuid;
        return typeof inner === 'string' ? inner : null;
      }
      return null;
    };

    const hfKey =
      extractUuid(paymeResult.uuid) ||
      extractUuid(paymeResult.seller_uuid) ||
      extractUuid(paymeResult.payme_public_key) ||
      extractUuid(paymeResult.public_key) ||
      extractUuid(paymeResult.hf_api_key) ||
      extractUuid(paymeResult.client_key) ||
      extractUuid(paymeResult.seller_public_key) ||
      null;
    console.log('Extracted hf_api_key candidate:', hfKey);

    const updateData: Record<string, string> = { seller_payme_id: paymeResult.seller_payme_id };
    if (hfKey) {
      updateData.hf_api_key = hfKey;
    }

    const { error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', body.eventId);

    if (updateError) {
      console.error('Failed to update event with seller ID:', updateError);
      // Don't fail - seller was created in PayMe
    }

    // Upload seller documents - check both body and payment_setup_data
    try {
      const filesToUpload: Array<{ base64: string; name: string; mimeType: string; type: number }> = [];

      // Prefer files from request body
      if (body.socialIdFile?.base64) {
        filesToUpload.push({
          base64: body.socialIdFile.base64,
          name: body.socialIdFile.name,
          mimeType: body.socialIdFile.mimeType || 'application/pdf',
          type: 1,
        });
      }
      if (body.bankApprovalFile?.base64) {
        filesToUpload.push({
          base64: body.bankApprovalFile.base64,
          name: body.bankApprovalFile.name,
          mimeType: body.bankApprovalFile.mimeType || 'application/pdf',
          type: 2,
        });
      }

      // Fallback to payment_setup_data
      if (filesToUpload.length === 0) {
        const { data: eventData } = await supabase
          .from('events')
          .select('payment_setup_data')
          .eq('id', body.eventId)
          .single();

        const setupData = eventData?.payment_setup_data as any;
        if (setupData?.socialIdFile?.base64) {
          filesToUpload.push({ ...setupData.socialIdFile, type: 1 });
        }
        if (setupData?.bankApprovalFile?.base64) {
          filesToUpload.push({ ...setupData.bankApprovalFile, type: 2 });
        }
      }

      if (filesToUpload.length > 0) {
        console.log(`Uploading ${filesToUpload.length} KYC documents for seller ${paymeResult.seller_payme_id}`);
        
        const sellerFiles = filesToUpload.map(f => ({
          name: f.name,
          type: f.type,
          base64: f.base64,
          mime_type: f.mimeType,
        }));

        const uploadResponse = await fetch('https://live.payme.io/api/upload-seller-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payme_client_key: paymeClientKey,
            seller_payme_id: paymeResult.seller_payme_id,
            seller_files: sellerFiles,
          }),
        });

        const uploadResult = await uploadResponse.json();
        console.log('PayMe upload-seller-files status_code:', uploadResult.status_code, 'msg:', uploadResult.status_error_details || uploadResult.status_message);

        if (uploadResult.status_code !== 0) {
          console.error('Failed to upload seller files');
        }
      }
    } catch (fileError) {
      console.error('Error uploading seller files (non-fatal):', fileError instanceof Error ? fileError.message : 'unknown');
    }

    return new Response(
      JSON.stringify({
        success: true,
        sellerPaymeId: paymeResult.seller_payme_id,
        hfApiKey: hfKey,
        message: 'Seller created successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in payme-create-seller:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
