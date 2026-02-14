// product-detail-info.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-detail-info',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail-info.component.html'
})
export class ProductDetailInfoComponent {
  product = {
    name: 'Muesli Fitness Nutritious Energy, gluten free',
    category: 'Cereals / Nestlé',
    price: 2.15,
    weight: '500g',
    description: 'Muesli Fitness Nutritious Energy is a delicious and satisfying blend of gluten-free oats, crunchy nuts, nutritious seeds, and flavorful dried fruits.',
    features: ['Gluten-free', 'Plant based', 'Vegan', 'Keto']
  };

  quantity = 1;

  incrementQuantity() {
    this.quantity++;
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    console.log('Added to cart:', this.product.name, 'Quantity:', this.quantity);
  }
}