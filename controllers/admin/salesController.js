const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');
const Category = require('../../models/categoryModel');
const User = require('../../models/userModel');
const { mongo, default: mongoose } = require('mongoose');

const salesReport = async (req,res)=>{
    try {
        console.log('sales report');

        const orders = await Order.find({}).populate('userId').sort({createdAt:-1});
        // const category = await Category.find({isListed:true},{name:1,_id:0}).map(category=>category.name);
        const category = await Category.find({isListed:true});
        // console.log(orders,'orders',category,'category');
        
        res.render('salesReport',{orders,category});
    } catch (error) {
        console.log(error.message,'sales report error');
        res.status(500).json({success:false, message:'Server error'})
    }
}

const fetchOrderList = async (req,res)=>{
    
        const {startDate,endDate,status,page=1,limit=5} = req.query;

        

        //setup data for sales graph of top 5 products correspoding to start and end date
        const topProductsPipeline = [
            {
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $unwind: "$orderItems"
            },
            {
                $group: {
                    _id: "$orderItems.product",
                    totalSales: { $sum: "$orderItems.quantity" }
                }
            },
            {
                $sort: { totalSales: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $unwind: "$product"
            },
            {
                $project: {
                    _id: 0,
                    productName: "$product.productName",
                    totalSales: 1
                }
            }
        ];

        const topProducts = await Order.aggregate(topProductsPipeline);
        console.log('Top 5 Products:', topProducts);



        console.log('startDate',startDate);
        console.log('endDate',endDate);
        console.log('status',status);
        console.log('limit',limit);
        console.log('page',page);
        
        const pipeline = [];
        
        pipeline.push({$match:{}});

        if(startDate && endDate){
            pipeline.push({
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            });
        }


        if(status){
            pipeline.push({
                $match: {
                    status: status
                }
            });
        }

        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        });
        pipeline.push({
            $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeline.push({
            $project: {
                _id: 1,
                orderId: 1,
                userId: 1,
                createdAt: 1,
                status: 1,
                product: 1,
                orderItems: 1,
                paymentStatus: 1,
                paymentMethod: 1,
                finalAmount: 1,
                total: 1,
                user: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phone: 1,
                }
            }
        });

        

// 5. Pagination (skip and limit)
const skip = (page - 1) * limit;
const limitStage = { $limit: parseInt(limit) };

// 6. Count total items for pagination (without applying skip and limit)
const countPipeline = [...pipeline, { $count: 'totalItems' }];

try {
    // Fetch both products and total count
    const [orders, totalItemsCount] = await Promise.all([
        Order.aggregate([...pipeline, { $skip: skip }, limitStage]),
        Order.aggregate(countPipeline),
    ]);
      
    const totalItems = totalItemsCount[0]?.totalItems || 0;

        // console.log(orders,'orders');

        if(orders.length > 0){
            res.status(200).json({success:true, orders, totalItems ,topProducts});
        }else{
            res.status(200).json({success:false, message:'No orders found'});
        }
       
        

    } catch (error) {
        console.log(error.message,'fetch sales report error');
        res.status(500).json({success:false, message:'Server error'})
    }
}
const fetchSalesReport = async (req,res)=>{
    
        const {startDate,endDate,status} = req.query;

        console.log('startDate',startDate);
        console.log('endDate',endDate);
        console.log('status',status);
           
        const pipeline = [];
        
        pipeline.push({$match:{}});

        if(startDate && endDate){
            pipeline.push({
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            });
        }


        if(status){
            pipeline.push({
                $match: {
                    status: status
                }
            });
        }

        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        });
        pipeline.push({
            $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeline.push({
            $project: {
                _id: 1,
                orderId: 1,
                userId: 1,
                createdAt: 1,
                status: 1,
                product: 1,
                orderItems: 1,
                paymentStatus: 1,
                paymentMethod: 1,
                finalAmount: 1,
                total: 1,
                user: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phone: 1,
                }
            }
        });

    try {
        // Fetch both products and total count
        const orders = await Order.aggregate(pipeline);
            // console.log(orders,'orders');

            if(orders.length > 0){
                res.status(200).json({success:true, orders});
            }else{
                res.status(200).json({success:false, message:'No orders found'});
            }
        
        } catch (error) {
            console.log(error.message,'fetch sales report error');
            res.status(500).json({success:false, message:'Server error'})
        }
    }




module.exports = {
    salesReport,
    fetchOrderList,
    fetchSalesReport
}