/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, IDisposable } from 'vs/base/common/lifecycle';
import { ContextKeyExpr } from 'vs/platform/contextkey/common/contextkey';
import { IWorkbenchContribution } from 'vs/workbench/common/contributions';
import { IExtensionPoint } from 'vs/workbench/services/extensions/common/extensionsRegistry';
import { ViewsWelcomeExtensionPoint, ViewWelcome, viewsWelcomeExtensionPointDescriptor } from './viewsWelcomeExtensionPoint';
import { Registry } from 'vs/platform/registry/common/platform';
import { Extensions as ViewContainerExtensions, IViewsRegistry } from 'vs/workbench/common/views';
import { localize } from 'vs/nls';

const viewsRegistry = Registry.as<IViewsRegistry>(ViewContainerExtensions.ViewsRegistry);

export class ViewsWelcomeContribution extends Disposable implements IWorkbenchContribution {

	private viewWelcomeContents = new Map<ViewWelcome, IDisposable>();

	constructor(extensionPoint: IExtensionPoint<ViewsWelcomeExtensionPoint>) {
		super();

		extensionPoint.setHandler((_, { added, removed }) => {
			for (const contribution of removed) {
				// Proposed API check
				if (!contribution.description.enableProposedApi) {
					continue;
				}

				for (const welcome of contribution.value) {
					const disposable = this.viewWelcomeContents.get(welcome);

					if (disposable) {
						disposable.dispose();
					}
				}
			}

			for (const contribution of added) {
				// Proposed API check
				if (!contribution.description.enableProposedApi) {
					contribution.collector.error(localize('proposedAPI.invalid', "The '{0}' contribution is a proposed API and is only available when running out of dev or with the following command line switch: --enable-proposed-api {1}", viewsWelcomeExtensionPointDescriptor.extensionPoint, contribution.description.identifier.value));
					continue;
				}

				for (const welcome of contribution.value) {
					const disposable = viewsRegistry.registerViewWelcomeContent(welcome.view, {
						content: welcome.contents,
						when: ContextKeyExpr.deserialize(welcome.when)
					});

					this.viewWelcomeContents.set(welcome, disposable);
				}
			}
		});
	}
}
