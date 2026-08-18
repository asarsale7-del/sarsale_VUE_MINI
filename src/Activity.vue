<template>
	<div>
		<Book book-name="Harry Potter and the Sorcerers Stone" author="J. Rowling" />
		<Book book-name="Harry Potter: The Goblet of Fire" author="J. Rowling" :is-sold="true" />
		<Book book-name="Harry Potter: Deathly Hollows" author="J. Rowling" />
	</div>
</template>

<script>
import { h } from 'vue'

export default {
	components: {
		Book: {
			props: {
				bookName: { type: String, required: true },
				author: { type: String, required: true },
				isSold: { type: Boolean, default: false }
			},
			render() {
				return h(
					'div',
					{ class: { sold: this.isSold, book: true } },
					[
						h('div', { class: 'title' }, this.bookName),
						h('div', { class: 'author' }, this.author)
					]
				)
			}
		}
	}
}
</script>

<style scoped>
div { padding: 12px; }
.book { margin-bottom: 12px; }
.title { font-size: 16px; }
.author { font-size: 14px; color: #333; }
.sold { color: red; font-weight: 700; }
</style>
