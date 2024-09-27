import dbConnect from '../../../lib/dbConnect';
import WaiterAssistance from '../../../models/WaiterAssistance';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const {
        query: { assistanceId },
        method,
    } = req;

    await dbConnect();

    switch (method) {
        case 'PATCH':
            try {
                // Validate assistanceId
                if (!assistanceId) {
                    return res.status(400).json({ success: false, message: 'Assistance ID is required' });
                }

                // Find and update the waiter assistance request
                const updatedAssistance = await WaiterAssistance.findByIdAndUpdate(
                    assistanceId,
                    { status: 'completed' },
                    { new: true, runValidators: true }
                );

                if (!updatedAssistance) {
                    return res.status(404).json({ success: false, message: 'Waiter assistance request not found' });
                }

                res.status(200).json({ success: true, data: updatedAssistance });
            } catch (error) {
                console.error('Error marking assistance as completed:', error);
                res.status(500).json({ success: false, message: 'An error occurred while marking assistance as completed' });
            }
            break;

        default:
            res.setHeader('Allow', ['PATCH']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);