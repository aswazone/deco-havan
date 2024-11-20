const User = require('../../models/userModel');

const loadUser = async (req, res) => {
    console.log('Fetching user list...');
    try {
        const search = req.query.search || ""; // Default to empty string if no search query
        const page = parseInt(req.query.page, 10) || 1; // Default to page 1
        const limit = 3; // Number of users per page

        // Fetch users based on search and pagination
        const users = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        // Get the total number of matching users
        const count = await User.countDocuments({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        });

        const totalPages = Math.ceil(count / limit); // Calculate total pages

        res.render('userlist2', {
            data: users,         // List of users for the current page
            count,               // Total user count
            search,              // Search term
            currentPage: page,   // Current page number
            totalPages,          // Total number of pages
            limit                // Limit per page
        });
    } catch (error) {
        console.error(error.message, 'userlist error');
        res.status(500).send('An error occurred while fetching users. Please try again.');
    }
};


// const userBlocked = async (req,res) =>{
//     try {
        
//         const id = req.params.id;
//         const user = await User.updateOne({_id:id},{$set:{isBlocked:true}});
//         res.json({success:true,message:`${user.name} blocked successfully`});

//     } catch (error) {
//         console.log(error.message,'user blocking error');
//         res.status(500).send('server error');
//     }
// }

const usertoggleStatus = async (req, res) => {
    try {
        console.log(req.body);

        const { id, condition } = req.body;

        console.log(id, condition);

        // Await the update operation
        const user = await User.findByIdAndUpdate(
            id,
            { isBlocked: condition },
        );

        console.log(user);
        

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const statusMessage = condition ? 'blocked' : 'unblocked';

        return res.json({
            success: true,
            message: `${user.name} ${statusMessage}`,
        });

    } catch (error) {
        console.error(error.message, 'user blocking error');
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    loadUser,
    usertoggleStatus
}