import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/dbConnect'
import Restaurant from '../../../models/Restaurant'
import { withCors } from '../../../lib/cors'

async function restaurantHandler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()

    // Add OPTIONS method handling for preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    const { id } = req.query

    try {
        const restaurant = await Restaurant.findOne({ id: id, isOnline: true })

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' })
        }

        // Convert Buffer data to a format that can be sent to the client
        const restaurantData = restaurant.toObject()
        if (restaurantData.bannerImage && restaurantData.bannerImage.data) {
            restaurantData.bannerImage = {
                data: restaurantData.bannerImage.data,
                contentType: restaurantData.bannerImage.contentType
            }
        }

        res.status(200).json([restaurantData])
    } catch (error) {
        console.error('Error fetching restaurant:', error)
        res.status(500).json({ message: 'Failed to fetch restaurant details' })
    }
}

// Wrap the handler with CORS middleware
export default withCors(restaurantHandler)