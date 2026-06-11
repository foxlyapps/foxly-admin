import { relations } from "drizzle-orm/relations";
import { shops, integrationSettings, quantityOfferGroups, formSettings, orderLogs } from "./schema";

export const integrationSettingsRelations = relations(integrationSettings, ({one}) => ({
	shop: one(shops, {
		fields: [integrationSettings.shopDomain],
		references: [shops.shopDomain]
	}),
}));

export const shopsRelations = relations(shops, ({many}) => ({
	integrationSettings: many(integrationSettings),
	quantityOfferGroups: many(quantityOfferGroups),
	formSettings: many(formSettings),
	orderLogs: many(orderLogs),
}));

export const quantityOfferGroupsRelations = relations(quantityOfferGroups, ({one}) => ({
	shop: one(shops, {
		fields: [quantityOfferGroups.shopDomain],
		references: [shops.shopDomain]
	}),
}));

export const formSettingsRelations = relations(formSettings, ({one}) => ({
	shop: one(shops, {
		fields: [formSettings.shopDomain],
		references: [shops.shopDomain]
	}),
}));

export const orderLogsRelations = relations(orderLogs, ({one}) => ({
	shop: one(shops, {
		fields: [orderLogs.shopDomain],
		references: [shops.shopDomain]
	}),
}));