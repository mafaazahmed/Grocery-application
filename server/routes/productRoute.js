import express from 'express';
import  upload  from '../configs/multer.js';
import authSeller from '../middlewares/authSeller.js';
import { addProduct, changeStock, ProductById, ProductList } from '../configs/controllers/productController.js';

const productRouter = express.Router();


productRouter.post('/add', upload.array('images'), authSeller, addProduct);
productRouter.get('/list', ProductList);
productRouter.get('/id', ProductById);
productRouter.post('/stock', authSeller, changeStock);

export default productRouter;