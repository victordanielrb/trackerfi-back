import { ObjectId } from 'mongodb';

/**
 * Safely convert string to MongoDB ObjectId
 * @param id - String ID to convert
 * @returns ObjectId if valid, null if invalid
 */
export const toObjectId = (id: string): ObjectId | null => {
    try {
        if (ObjectId.isValid(id)) {
            return new ObjectId(id);
        }
        return null;
    } catch (error) {
        return null;
    }
};

/**
 * Convert ObjectId to string safely
 * @param id - ObjectId to convert
 * @returns String representation of ObjectId
 */
export const fromObjectId = (id: ObjectId): string => {
    return id.toString();
};

/**
 * Check if a string is a valid ObjectId
 * @param id - String to validate
 * @returns Boolean indicating if valid ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
    return ObjectId.isValid(id);
};
