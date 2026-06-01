// API to validate slug format for clinic registration
import { validateSlug } from '../../../lib/slugService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Slug is required',
      });
    }

    const validation = validateSlug(slug);

    if (validation.valid) {
      return res.status(200).json({
        success: true,
        valid: true,
        message: 'Slug is available',
        user_message: '✔️ This clinic name is available and safe to publish.',
      });
    } else {
      return res.status(200).json({
        success: true,
        valid: false,
        message: validation.error,
        user_message: `⚠️ ${validation.error}`,
      });
    }
  } catch (err) {
    console.error('❌ Slug Validation Error:', err);
    return res.status(500).json({
      success: false,
      valid: false,
      message: 'Error validating slug',
      error: err.message,
    });
  }
}
