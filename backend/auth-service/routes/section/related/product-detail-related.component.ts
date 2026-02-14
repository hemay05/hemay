// product-detail-related.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  weight: string;
  discount?: boolean;
  discountAmount?: string;
}

@Component({
  selector: 'app-product-detail-related',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail-related.component.html'
})
export class ProductDetailRelatedComponent {
  
  relatedProducts: Product[] = [
    {
      id: 2,
      name: 'Fresh orange Klementina, Spain',
      price: 3.12,
      originalPrice: 4.05,
      image: 'assets/cartzilla/img/shop/grocery/02.png',
      weight: '1kg',
      discount: true,
      discountAmount: '-30%'
    },
    {
      id: 3,
      name: 'Pepsi soda classic, can',
      price: 0.80,
      image: 'assets/cartzilla/img/shop/grocery/03.png',
      weight: '330ml'
    },
    {
      id: 4,
      name: 'Mozzarella mini cheese Granaloro',
      price: 2.99,
      image: 'assets/cartzilla/img/shop/grocery/04.png',
      weight: '250g'
    },
    {
      id: 5,
      name: 'Coconut, Indonesia',
      price: 1.24,
      image: 'assets/cartzilla/img/shop/grocery/05.png',
      weight: '1 coconut'
    },
    {
      id: 6,
      name: 'Fresh orange Klementina, Spain',
      price: 3.12,
      originalPrice: 4.05,
      image: 'assets/cartzilla/img/shop/grocery/02.png',
      weight: '1kg',
      discount: true,
      discountAmount: '-30%'
    },
    {
      id: 7,
      name: 'Pepsi soda classic, can',
      price: 0.80,
      image: 'assets/cartzilla/img/shop/grocery/03.png',
      weight: '330ml'
    },
    {
      id: 8,
      name: 'Mozzarella mini cheese Granaloro',
      price: 2.99,
      image: 'assets/cartzilla/img/shop/grocery/04.png',
      weight: '250g'
    },
    {
      id: 9,
      name: 'Coconut, Indonesia',
      price: 1.24,
      image: 'assets/cartzilla/img/shop/grocery/05.png',
      weight: '1 coconut'
    }
  ];

  addToCart(product: Product) {
    console.log('Added related product to cart:', product);
  }
}