/**
 * Interface representing a lecturer.
 */
interface IsLecturer {
    id: number;
    nama: string;
    nidn: string;
    email: string;
    telepon: string;
}

/**
 * Interface representing the parameters for handling a lecturer's message.
 */
interface HandleLecturer {
    msg: Message;
    conversation: string;
    isLecturer: IsLecturer;
}
